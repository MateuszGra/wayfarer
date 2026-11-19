import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import LoginForm from './LoginForm.vue';

const fill = async (wrapper: ReturnType<typeof mount>, email: string, password: string) => {
  await wrapper.get('#login-email').setValue(email);
  await wrapper.get('#login-password').setValue(password);
  await wrapper.get('form').trigger('submit');
};

describe('LoginForm', () => {
  it('shows what is missing and does not submit an empty form', async () => {
    const wrapper = mount(LoginForm);

    await fill(wrapper, '', '');

    expect(wrapper.text()).toContain('Wpisz poprawny adres e-mail.');
    expect(wrapper.text()).toContain('Wpisz hasło.');
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('submits the trimmed email and the password', async () => {
    const wrapper = mount(LoginForm);

    await fill(wrapper, '  wanderer@example.com ', 'camino');

    expect(wrapper.emitted('submit')).toEqual([[{ email: 'wanderer@example.com', password: 'camino' }]]);
  });

  it('asks for a password reminder from the small link', async () => {
    const wrapper = mount(LoginForm);

    await wrapper.get('[data-testid="login-forgot"]').trigger('click');

    expect(wrapper.emitted('forgot-password')).toHaveLength(1);
  });
});
