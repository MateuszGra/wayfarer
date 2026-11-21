import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { pl } from '@/shared/i18n/pl';
import ForgotPasswordView from './ForgotPasswordView.vue';

// The network boundary: our own API module, replaced so no request leaves the test.
const api = vi.hoisted(() => ({
  requestPasswordReset: vi.fn<(email: string) => Promise<void>>(),
  resetPassword: vi.fn(),
  fetchCurrentAccount: vi.fn(),
  logout: vi.fn(),
}));
vi.mock('@/shared/api/auth', () => api);
// The landscape behind the card needs WebGL, which jsdom lacks; here it simply never starts.
vi.mock('@/scene-engine', () => ({ createScene: () => new Promise(() => {}) }));

async function open() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:any(.*)*', component: ForgotPasswordView }],
  });
  await router.push('/forgot-password');
  return mount(ForgotPasswordView, { global: { plugins: [router] } });
}
async function ask(wrapper: Awaited<ReturnType<typeof open>>, email: string) {
  await wrapper.get('[data-testid="forgot-email"] input').setValue(email);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
}

beforeEach(() => {
  api.requestPasswordReset.mockReset().mockResolvedValue(undefined);
});

describe('ForgotPasswordView', () => {
  it('asks for a link for the address and says where it went', async () => {
    const wrapper = await open();

    await ask(wrapper, ' ana@example.com ');

    expect(api.requestPasswordReset).toHaveBeenCalledWith('ana@example.com');
    expect(wrapper.get('[data-testid="forgot-sent"]').text()).toBe(pl['auth.forgotPassword.sent']);
  });

  it('asks nothing for an address that is not an address', async () => {
    const wrapper = await open();

    await ask(wrapper, 'ana');

    expect(api.requestPasswordReset).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(pl['auth.error.emailInvalid']);
  });
});
