import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ChangePasswordForm from './ChangePasswordForm.vue';

const fill = async (wrapper: ReturnType<typeof mount>, current: string, next: string, repeat: string) => {
  await wrapper.get('#settings-password-current').setValue(current);
  await wrapper.get('#settings-password-new').setValue(next);
  await wrapper.get('#settings-password-repeat').setValue(repeat);
  await wrapper.get('form').trigger('submit');
};

describe('ChangePasswordForm', () => {
  it('asks for the current password when it is empty', async () => {
    const wrapper = mount(ChangePasswordForm);

    await fill(wrapper, '', 'santiago2026', 'santiago2026');

    expect(wrapper.text()).toContain('Wpisz hasło.');
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('rejects a new password shorter than eight characters', async () => {
    const wrapper = mount(ChangePasswordForm);

    await fill(wrapper, 'camino2026', '1234567', '1234567');

    expect(wrapper.text()).toContain('Hasło musi mieć co najmniej 8 znaków.');
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('rejects a new password equal to the current one', async () => {
    const wrapper = mount(ChangePasswordForm);

    await fill(wrapper, 'camino2026', 'camino2026', 'camino2026');

    expect(wrapper.text()).toContain('Nowe hasło musi się różnić od obecnego.');
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('rejects a repeated new password that differs', async () => {
    const wrapper = mount(ChangePasswordForm);

    await fill(wrapper, 'camino2026', 'santiago2026', 'santiago2025');

    expect(wrapper.text()).toContain('Hasła nie są takie same.');
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('submits the current and the new password when the change is valid', async () => {
    const wrapper = mount(ChangePasswordForm);

    await fill(wrapper, 'camino2026', 'santiago2026', 'santiago2026');

    expect(wrapper.emitted('submit')).toEqual([[{ currentPassword: 'camino2026', newPassword: 'santiago2026' }]]);
  });
});
