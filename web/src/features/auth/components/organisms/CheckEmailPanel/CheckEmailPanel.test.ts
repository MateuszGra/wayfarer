import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CheckEmailPanel from './CheckEmailPanel.vue';

/** Pastes into the first box, as a player would paste the code copied from the e-mail. */
const pasteCode = async (wrapper: VueWrapper, text: string) => {
  const first = wrapper.get('.base-code-input__digit').element;
  first.dispatchEvent(
    Object.assign(new Event('paste', { bubbles: true, cancelable: true }), { clipboardData: { getData: () => text } }),
  );
  await flushPromises();
};

describe('CheckEmailPanel', () => {
  it('names the address the link went to', () => {
    const wrapper = mount(CheckEmailPanel, { props: { email: 'ana@example.com' } });

    expect(wrapper.get('[data-testid="check-email-lead"]').text()).toContain('ana@example.com');
  });

  it('sends the code on its own once all six digits are in, once only', async () => {
    const wrapper = mount(CheckEmailPanel, { props: { email: 'ana@example.com' } });

    await pasteCode(wrapper, '482-917');

    expect(wrapper.emitted('confirm')).toEqual([['482917']]);
  });

  it('asks for all six digits and sends nothing when confirmed with fewer', async () => {
    const wrapper = mount(CheckEmailPanel, { props: { email: 'ana@example.com' } });
    await pasteCode(wrapper, '48291');

    await wrapper.get('form').trigger('submit');

    expect(wrapper.get('[data-testid="check-email-code-error"]').text()).toBe('Wpisz wszystkie 6 cyfr kodu.');
    expect(wrapper.emitted('confirm')).toBeUndefined();
  });

  it('names each box in Polish for screen readers', () => {
    const wrapper = mount(CheckEmailPanel, { props: { email: 'ana@example.com' } });

    expect(wrapper.get('.base-code-input__digit').attributes('aria-label')).toBe('Cyfra 1 z 6');
  });

  it('asks for a fresh link from its button', async () => {
    const wrapper = mount(CheckEmailPanel, { props: { email: 'ana@example.com' } });

    await wrapper.get('[data-testid="check-email-resend"]').trigger('click');

    expect(wrapper.emitted('resend')).toHaveLength(1);
  });

  it('keeps both buttons disabled while a request is on its way', () => {
    const wrapper = mount(CheckEmailPanel, { props: { email: 'ana@example.com', pending: true } });

    expect(wrapper.get('[data-testid="check-email-confirm"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[data-testid="check-email-resend"]').attributes('disabled')).toBeDefined();
  });

  it('says a fresh link was sent', () => {
    const wrapper = mount(CheckEmailPanel, { props: { email: 'ana@example.com', resent: true } });

    expect(wrapper.find('[data-testid="check-email-resent"]').exists()).toBe(true);
  });

  it('goes back to sign-in from the small link', async () => {
    const wrapper = mount(CheckEmailPanel, { props: { email: 'ana@example.com' } });

    await wrapper.get('[data-testid="check-email-back"]').trigger('click');

    expect(wrapper.emitted('back')).toHaveLength(1);
  });
});
