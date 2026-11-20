import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RegisterForm from './RegisterForm.vue';

const fill = async (wrapper: ReturnType<typeof mount>, email: string, password: string, repeat: string) => {
  await wrapper.get('#register-email').setValue(email);
  await wrapper.get('#register-password').setValue(password);
  await wrapper.get('#register-repeat').setValue(repeat);
  await wrapper.get('form').trigger('submit');
};

describe('RegisterForm', () => {
  it('rejects a password shorter than eight characters', async () => {
    const wrapper = mount(RegisterForm);

    await fill(wrapper, 'wanderer@example.com', '1234567', '1234567');

    expect(wrapper.text()).toContain('Hasło musi mieć co najmniej 8 znaków.');
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('rejects a repeated password that differs', async () => {
    const wrapper = mount(RegisterForm);

    await fill(wrapper, 'wanderer@example.com', 'camino2026', 'camino2025');

    expect(wrapper.text()).toContain('Hasła nie są takie same.');
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('submits a valid new account', async () => {
    const wrapper = mount(RegisterForm);

    await fill(wrapper, 'wanderer@example.com', 'camino2026', 'camino2026');

    expect(wrapper.emitted('submit')).toEqual([[{ email: 'wanderer@example.com', password: 'camino2026' }]]);
  });

  it('tells the minimum password length before anything is typed', () => {
    const wrapper = mount(RegisterForm);

    const input = wrapper.get('#register-password');

    expect(wrapper.get(`#${input.attributes('aria-describedby')}`).text()).toBe('Co najmniej 8 znaków.');
  });

  it('shows the server answer above the button', () => {
    const wrapper = mount(RegisterForm, { props: { error: 'Konto z tym adresem już istnieje. Zaloguj się.' } });

    expect(wrapper.get('[data-testid="register-error"]').text()).toBe('Konto z tym adresem już istnieje. Zaloguj się.');
  });

  it('keeps the button disabled while the account is being created', () => {
    const wrapper = mount(RegisterForm, { props: { pending: true } });

    expect(wrapper.get('[data-testid="register-submit"]').attributes('disabled')).toBeDefined();
  });
});
