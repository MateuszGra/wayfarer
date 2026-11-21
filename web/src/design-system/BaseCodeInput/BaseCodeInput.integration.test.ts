import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import BaseCodeInput from './BaseCodeInput.vue';

// Real Reka PinInput underneath: these check how our adapter turns its boxes into one code.
const mounted: VueWrapper[] = [];
function mountCode(modelValue = '') {
  const wrapper = mount(BaseCodeInput, {
    props: {
      modelValue,
      digitLabel: (position: number, length: number) => `Cyfra ${position} z ${length}`,
      'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
    },
    attachTo: document.body,
  });
  mounted.push(wrapper);
  return wrapper;
}
// Reka adds a hidden form input of its own; only the visible boxes count.
const boxes = (wrapper: VueWrapper) => wrapper.findAll('.base-code-input__digit');
const box = (wrapper: VueWrapper, index: number) => {
  const found = boxes(wrapper)[index];
  if (!found) throw new Error(`No box ${index + 1}`);
  return found;
};
const paste = async (input: HTMLInputElement, text: string) => {
  const event = Object.assign(new Event('paste', { bubbles: true, cancelable: true }), {
    clipboardData: { getData: () => text },
  });
  input.dispatchEvent(event);
  await flushPromises();
};
const typeDigit = async (input: HTMLInputElement, digit: string) => {
  input.value = digit;
  input.dispatchEvent(new InputEvent('input', { data: digit, bubbles: true }));
  await flushPromises();
};

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount());
});

describe('BaseCodeInput', () => {
  it('shows six boxes with a dash after the third', () => {
    const wrapper = mountCode();

    expect(boxes(wrapper)).toHaveLength(6);
    expect(wrapper.find('.base-code-input__separator').element.previousElementSibling).toBe(box(wrapper, 2).element);
  });

  it('names each box with the given label instead of the English default', () => {
    const wrapper = mountCode();

    expect(box(wrapper, 1).attributes('aria-label')).toBe('Cyfra 2 z 6');
  });

  it('fills every box from a pasted code, dash and spaces dropped, and reports it complete', async () => {
    const wrapper = mountCode();

    await paste(box(wrapper, 0).element as HTMLInputElement, ' 482-917 ');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['482917']);
    expect(wrapper.emitted('complete')).toEqual([['482917']]);
  });

  it('keeps a leading zero', async () => {
    const wrapper = mountCode();

    await paste(box(wrapper, 0).element as HTMLInputElement, '012345');

    expect(wrapper.emitted('complete')).toEqual([['012345']]);
  });

  it('reports a code again once it was changed and typed in anew', async () => {
    const wrapper = mountCode();
    await paste(box(wrapper, 0).element as HTMLInputElement, '482917');
    await box(wrapper, 5).trigger('keydown', { key: 'Backspace' });

    await typeDigit(box(wrapper, 5).element as HTMLInputElement, '7');

    expect(wrapper.emitted('complete')).toEqual([['482917'], ['482917']]);
  });

  it('moves on to the next box after a digit', async () => {
    const wrapper = mountCode();
    const first = box(wrapper, 0).element as HTMLInputElement;
    first.focus();

    await typeDigit(first, '4');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['4']);
    expect(document.activeElement).toBe(box(wrapper, 1).element);
  });

  it('goes back and clears the previous digit on backspace in an empty box', async () => {
    const wrapper = mountCode('48');
    const third = box(wrapper, 2);

    await third.trigger('keydown', { key: 'Backspace' });

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['4']);
    expect(document.activeElement).toBe(box(wrapper, 1).element);
  });
});
