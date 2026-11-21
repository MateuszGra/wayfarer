import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { ApiRequestError } from '@/shared/api/client';
import { resetSessionForTests, useSession } from '@/shared/composables/useSession';
import { useAuthForms } from './useAuthForms';

const api = vi.hoisted(() => ({
  login: vi.fn<(email: string, password: string) => Promise<{ email: string }>>(),
  register: vi.fn<(email: string, password: string) => Promise<void>>(),
  resendVerification: vi.fn<(email: string) => Promise<void>>(),
  confirmEmailWithCode: vi.fn<(email: string, code: string) => Promise<{ email: string }>>(),
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
  api.register.mockReset().mockResolvedValue(undefined);
  api.resendVerification.mockReset().mockResolvedValue(undefined);
  api.confirmEmailWithCode.mockReset().mockResolvedValue({ email: 'ana@example.com' });
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

  it('creates an account and asks the player to follow the e-mailed link, without signing in', async () => {
    const { forms, router } = await mountForms();

    await forms.register(CREDENTIALS);

    expect(api.register).toHaveBeenCalledWith('ana@example.com', 'camino2026');
    expect(forms.awaitingConfirmation.value).toBe('ana@example.com');
    expect(useSession().account.value).toBeNull();
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('asks to follow the link, rather than showing an error, when the address is still unconfirmed', async () => {
    api.login.mockRejectedValue(new ApiRequestError('email_not_verified', 403));
    const { forms, router } = await mountForms();

    await forms.login(CREDENTIALS);

    expect(forms.awaitingConfirmation.value).toBe('ana@example.com');
    expect(forms.error.value).toBeNull();
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('sends a fresh link to the address waiting for confirmation', async () => {
    const { forms } = await mountForms();
    await forms.register(CREDENTIALS);

    await forms.resend();

    expect(api.resendVerification).toHaveBeenCalledWith('ana@example.com');
    expect(forms.resent.value).toBe(true);
  });

  it('says why a fresh link could not be sent', async () => {
    api.resendVerification.mockRejectedValue(new ApiRequestError(null, null));
    const { forms } = await mountForms();
    await forms.register(CREDENTIALS);

    await forms.resend();

    expect(forms.resent.value).toBe(false);
    expect(forms.error.value).toBe('Brak połączenia z internetem.');
  });

  it('confirms with the code for the waiting address, signs in and takes the player on to the game', async () => {
    const { forms, router } = await mountForms();
    await forms.register(CREDENTIALS);

    await forms.confirmCode('482917');
    await flushPromises();

    expect(api.confirmEmailWithCode).toHaveBeenCalledWith('ana@example.com', '482917');
    expect(useSession().account.value).toEqual({ email: 'ana@example.com' });
    expect(router.currentRoute.value.path).toBe('/scene');
  });

  it('says the code was wrong and keeps waiting for confirmation', async () => {
    api.confirmEmailWithCode.mockRejectedValue(new ApiRequestError('verification_code_invalid', 400));
    const { forms, router } = await mountForms();
    await forms.register(CREDENTIALS);

    await forms.confirmCode('999999');

    expect(forms.error.value).toBe('Kod jest nieprawidłowy albo wygasł. Sprawdź go albo wyślij nowy.');
    expect(forms.awaitingConfirmation.value).toBe('ana@example.com');
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('returns to the sign-in form from waiting for confirmation', async () => {
    const { forms } = await mountForms();
    await forms.register(CREDENTIALS);
    await forms.resend();

    forms.backToSignIn();

    expect(forms.awaitingConfirmation.value).toBeNull();
    expect(forms.resent.value).toBe(false);
  });
});
