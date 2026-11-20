import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import YesterdayStepsDialog, { type Props } from './YesterdayStepsDialog.vue';

// The dialog renders through a portal, so it is queried on the document rather than the wrapper.
const query = (testId: string) => document.body.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
const input = () => query('yesterday-steps-input')?.querySelector('input') as HTMLInputElement;
const text = (testId: string) =>
  query(testId)
    ?.textContent?.trim()
    .replace(/\u00a0/g, ' ');

async function openDialog(props: Partial<Props> = {}) {
  const wrapper = mount(YesterdayStepsDialog, {
    props: { open: true, day: 4, stepsDate: '2026-11-19', ...props },
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper;
}
async function enter(value: string) {
  input().value = value;
  input().dispatchEvent(new Event('input'));
  await flushPromises();
}
async function save() {
  query('yesterday-steps-submit')?.click();
  await flushPromises();
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('YesterdayStepsDialog', () => {
  it('asks about yesterday, naming the day on the road and the date of the steps', async () => {
    await openDialog();

    expect(document.body.textContent).toContain('Ile kroków zrobiłeś wczoraj?');
    expect(document.body.textContent).toContain('Dzień 4 · kroki z dnia czwartek, 19 listopada');
  });

  it('shows only the distance the steps stand for, not how long the traveller would walk', async () => {
    await openDialog();

    await enter('5 000');

    expect(document.body.textContent).toContain('Przeszedłeś około 3,8 km');
    expect(document.body.textContent).not.toContain('pójdzie do');
  });

  it('saves the steps, spaces and all', async () => {
    const wrapper = await openDialog();
    await enter('8 500');

    await save();

    expect(wrapper.emitted('submit')).toEqual([[8_500]]);
  });

  it('asks to confirm more than 30 000 steps before saving them', async () => {
    const wrapper = await openDialog();
    await enter('30001');

    await save();

    expect(text('yesterday-steps-confirm')).toBe('To bardzo dużo: 30 001 kroków. Na pewno?');
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('saves a confirmed big number on the second press', async () => {
    const wrapper = await openDialog();
    await enter('35000');
    await save();

    await save();

    expect(wrapper.emitted('submit')).toEqual([[35_000]]);
  });

  it('saves exactly 30 000 steps without asking', async () => {
    const wrapper = await openDialog();
    await enter('30000');

    await save();

    expect(wrapper.emitted('submit')).toEqual([[30_000]]);
  });

  it.each(['50001', 'dużo', ''])('refuses "%s"', async (value) => {
    const wrapper = await openDialog();
    await enter(value);

    await save();

    expect(document.body.textContent).toContain('Wpisz prawdziwą wartość.');
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('cannot be closed until the steps are in', async () => {
    const wrapper = await openDialog();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await flushPromises();

    expect(query('dialog-close')).toBeNull();
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });

  it('can be closed when correcting steps already entered, and starts with them', async () => {
    const wrapper = await openDialog({ correcting: 9_000 });

    query('dialog-close')?.click();
    await flushPromises();

    expect(input().value).toBe('9000');
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });
});
