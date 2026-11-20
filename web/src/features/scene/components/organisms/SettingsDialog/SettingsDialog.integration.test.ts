import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '@/shared/api/client';
import SettingsDialog from './SettingsDialog.vue';

// The network boundary: our own API module, replaced so no request leaves the test.
const api = vi.hoisted(() => ({ changePassword: vi.fn<(current: string, next: string) => Promise<void>>() }));
vi.mock('@/shared/api/auth', () => api);

// The dialog renders through a portal, so it is queried on the document rather than the wrapper.
const query = (testId: string) => document.body.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
// A form field's test id sits on its wrapper; the input is inside it.
const input = (testId: string) => query(testId)?.querySelector('input') as HTMLInputElement;
const type = (testId: string, value: string) => {
  input(testId).value = value;
  input(testId).dispatchEvent(new Event('input'));
};

async function openSettings() {
  const wrapper = mount(SettingsDialog, { props: { open: true }, attachTo: document.body });
  await flushPromises();
  return wrapper;
}
async function changePassword() {
  type('settings-password-current', 'camino2026');
  type('settings-password-new', 'santiago2026');
  type('settings-password-repeat', 'santiago2026');
  query('settings-password-submit')?.click();
  await flushPromises();
}

beforeEach(() => {
  api.changePassword.mockReset().mockResolvedValue(undefined);
});
afterEach(() => {
  document.body.innerHTML = '';
});

describe('SettingsDialog', () => {
  it('sends the current and the new password to the server', async () => {
    await openSettings();

    await changePassword();

    expect(api.changePassword).toHaveBeenCalledWith('camino2026', 'santiago2026');
  });

  it('confirms the change and clears the form once the server accepts it', async () => {
    await openSettings();

    await changePassword();

    expect(query('settings-password-changed')?.textContent?.trim()).toBe('Hasło zostało zmienione.');
    expect(input('settings-password-new').value).toBe('');
  });

  it('shows what the server rejected and keeps the typed passwords', async () => {
    api.changePassword.mockRejectedValue(new ApiRequestError('wrong_password', 403));
    await openSettings();

    await changePassword();

    expect(query('settings-password-error')?.textContent?.trim()).toBe('Obecne hasło jest nieprawidłowe.');
    expect(query('settings-password-changed')).toBeNull();
    expect(input('settings-password-new').value).toBe('santiago2026');
  });

  it('drops the confirmation once the window is closed', async () => {
    const wrapper = await openSettings();
    await changePassword();

    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });
    await flushPromises();

    expect(query('settings-password-changed')).toBeNull();
  });
});
