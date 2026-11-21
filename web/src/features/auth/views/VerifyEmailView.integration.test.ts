import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { ApiRequestError } from '@/shared/api/client';
import { resetSessionForTests, useSession } from '@/shared/composables/useSession';
import { pl } from '@/shared/i18n/pl';
import VerifyEmailView from './VerifyEmailView.vue';

// The network boundary: our own API module, replaced so no request leaves the test.
const api = vi.hoisted(() => ({
  confirmEmail: vi.fn<(token: string) => Promise<{ email: string }>>(),
  fetchCurrentAccount: vi.fn(),
  logout: vi.fn(),
}));
vi.mock('@/shared/api/auth', () => api);
// The landscape behind the card needs WebGL, which jsdom lacks; here it simply never starts.
vi.mock('@/scene-engine', () => ({ createScene: () => new Promise(() => {}) }));

async function openLink(url: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/verify-email', component: VerifyEmailView },
      { path: '/:any(.*)*', component: { render: () => null } },
    ],
  });
  await router.push(url);
  const wrapper = mount(VerifyEmailView, { global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
}
const status = (wrapper: Awaited<ReturnType<typeof openLink>>) =>
  wrapper.get('[data-testid="verify-email-status"]').text();

beforeEach(() => {
  resetSessionForTests();
  api.confirmEmail.mockReset().mockResolvedValue({ email: 'ana@example.com' });
});

describe('VerifyEmailView', () => {
  it('confirms the address with the token from the link and signs the player in', async () => {
    const wrapper = await openLink('/verify-email?token=abc123');

    expect(api.confirmEmail).toHaveBeenCalledWith('abc123');
    expect(status(wrapper)).toBe(pl['verifyEmail.done']);
    expect(useSession().account.value).toEqual({ email: 'ana@example.com' });
    expect(wrapper.find('[data-testid="verify-email-to-game"]').exists()).toBe(true);
  });

  it('says the link has expired or was used when the server refuses it', async () => {
    api.confirmEmail.mockRejectedValue(new ApiRequestError('verification_invalid', 400));

    const wrapper = await openLink('/verify-email?token=old');

    expect(status(wrapper)).toBe(`${pl['errors.verification_invalid']} ${pl['verifyEmail.failedHint']}`);
    expect(useSession().account.value).toBeNull();
    expect(wrapper.find('[data-testid="verify-email-to-login"]').exists()).toBe(true);
  });

  it('asks the server nothing when the link has no token', async () => {
    const wrapper = await openLink('/verify-email');

    expect(api.confirmEmail).not.toHaveBeenCalled();
    expect(status(wrapper)).toBe(`${pl['errors.verification_invalid']} ${pl['verifyEmail.failedHint']}`);
  });
});
