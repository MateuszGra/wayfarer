import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AuthPanel from './AuthPanel.vue';

describe('AuthPanel', () => {
  it('opens on the sign-in form', () => {
    const wrapper = mount(AuthPanel);

    expect(wrapper.find('#login-email').exists()).toBe(true);
    expect(wrapper.find('#register-repeat').exists()).toBe(false);
  });

  it('switches to account creation from its tab', async () => {
    const wrapper = mount(AuthPanel);

    await wrapper.get('[data-testid="auth-tab-register"]').trigger('click');

    expect(wrapper.find('#register-repeat').exists()).toBe(true);
    expect(wrapper.get('[data-testid="auth-tab-register"]').attributes('aria-selected')).toBe('true');
  });

  it('passes valid sign-in details up', async () => {
    const wrapper = mount(AuthPanel);

    await wrapper.get('#login-email').setValue('wanderer@example.com');
    await wrapper.get('#login-password').setValue('camino');
    await wrapper.get('form').trigger('submit');

    expect(wrapper.emitted('login')).toEqual([[{ email: 'wanderer@example.com', password: 'camino' }]]);
  });
});
