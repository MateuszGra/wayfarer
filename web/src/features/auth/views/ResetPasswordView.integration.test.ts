import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { ApiRequestError } from '@/shared/api/client';
import { resetSessionForTests, useSession } from '@/shared/composables/useSession';
import { pl } from '@/shared/i18n/pl';
import ResetPasswordView from './ResetPasswordView.vue';

// The network boundary: our own API module, replaced so no request leaves the test.
const api = vi.hoisted(() => ({
  resetPassword: vi.fn<(token: string, password: string) => Promise<{ email: string }>>(),
  requestPasswordReset: vi.fn(),
  fetchCurrentAccount: vi.fn(),
  logout: vi.fn(),
}));
vi.mock('@/shared/api/auth', () => api);
// The landscape behind the card needs WebGL, which jsdom lacks; here it simply never starts.
vi.mock('@/scene-engine', () => ({ createScene: () => new Promise(() => {}) }));
vi.mock('@/shared/composables/useJourney', () => ({ forgetJourney: () => {} }));

async function openLink(url: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/reset-password', component: ResetPasswordView },
      { path: '/:any(.*)*', component: { render: () => null } },
    ],
  });
  await router.push(url);
  const wrapper = mount(ResetPasswordView, { global: { plugins: [router] } });
  return { wrapper, router };
}
async function setPassword(wrapper: Awaited<ReturnType<typeof openLink>>['wrapper'], next: string, repeat = next) {
  await wrapper.get('[data-testid="reset-password-new"] input').setValue(next);
  await wrapper.get('[data-testid="reset-password-repeat"] input').setValue(repeat);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
}

beforeEach(() => {
  resetSessionForTests();
  api.resetPassword.mockReset().mockResolvedValue({ email: 'ana@example.com' });
});

describe('ResetPasswordView', () => {
  it('sets the new password with the link’s token, signs the player in and opens the game', async () => {
    const { wrapper, router } = await openLink('/reset-password?token=abc123');

    await setPassword(wrapper, 'santiago2026');

    expect(api.resetPassword).toHaveBeenCalledWith('abc123', 'santiago2026');
    expect(useSession().account.value).toEqual({ email: 'ana@example.com' });
    expect(router.currentRoute.value.path).toBe('/scene');
  });

  it('sends nothing when the two passwords differ', async () => {
    const { wrapper } = await openLink('/reset-password?token=abc123');

    await setPassword(wrapper, 'santiago2026', 'santiago2027');

    expect(api.resetPassword).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(pl['auth.error.passwordMismatch']);
  });

  it('says the link has expired when the server refuses it', async () => {
    api.resetPassword.mockRejectedValue(new ApiRequestError('reset_invalid', 400));
    const { wrapper } = await openLink('/reset-password?token=old');

    await setPassword(wrapper, 'santiago2026');

    expect(wrapper.get('[data-testid="reset-password-error"]').text()).toBe(pl['errors.reset_invalid']);
  });

  it('shows no form for a link without a token', async () => {
    const { wrapper } = await openLink('/reset-password');

    expect(wrapper.find('form').exists()).toBe(false);
    expect(wrapper.get('[data-testid="reset-password-missing"]').text()).toBe(pl['errors.reset_invalid']);
  });
});
