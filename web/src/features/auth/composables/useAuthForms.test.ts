import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { ApiRequestError } from '@/shared/api/client';
import { resetSessionForTests, useSession } from '@/shared/composables/useSession';
import { useAuthForms } from './useAuthForms';

const api = vi.hoisted(() => ({
  login: vi.fn<(email: string, password: string) => Promise<{ email: string }>>(),
  register: vi.fn<(email: string, password: string) => Promise<{ email: string }>>(),
  fetchCurrentAccount: vi.fn(),
  logout: vi.fn(),
}));
vi.mock('@/shared/api/auth', () => api);

async function mountForms(startAt = '/login') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:any(.*)*', component: { render: () => null } }],
  });
  await router.push(startAt);
  let forms!: ReturnType<typeof useAuthForms>;
  mount(defineComponent({ setup: () => ((forms = useAuthForms()), () => h('div')) }), {
    global: { plugins: [router] },
  });
  return { forms, router };
}
const CREDENTIALS = { email: 'ana@example.com', password: 'camino2026' };

beforeEach(() => {
  resetSessionForTests();
  api.login.mockReset().mockResolvedValue({ email: 'ana@example.com' });
  api.register.mockReset().mockResolvedValue({ email: 'ana@example.com' });
});

describe('useAuthForms', () => {
  it('signs in and takes the player on to the game, where the router sends a new player to plan first', async () => {
    const { forms, router } = await mountForms();

    await forms.login(CREDENTIALS);
    await flushPromises();

    expect(useSession().account.value).toEqual({ email: 'ana@example.com' });
    expect(router.currentRoute.value.path).toBe('/scene');
  });

  it('returns the player to the page they were sent to sign in from', async () => {
    const { forms, router } = await mountForms('/login?redirect=/scene');

    await forms.login(CREDENTIALS);
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/scene');
  });

  it('ignores a redirect to another site', async () => {
    const { forms, router } = await mountForms('/login?redirect=//evil.example.com');

    await forms.login(CREDENTIALS);
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/scene');
  });

  it('shows the server answer in the player words and stays on sign-in', async () => {
    api.login.mockRejectedValue(new ApiRequestError('invalid_credentials', 401));
    const { forms, router } = await mountForms();

    await forms.login(CREDENTIALS);

    expect(forms.error.value).toBe('Nieprawidłowy e-mail lub hasło.');
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('creates an account and signs the player in', async () => {
    const { forms } = await mountForms();

    await forms.register(CREDENTIALS);

    expect(api.register).toHaveBeenCalledWith('ana@example.com', 'camino2026');
    expect(useSession().account.value).toEqual({ email: 'ana@example.com' });
  });
});
