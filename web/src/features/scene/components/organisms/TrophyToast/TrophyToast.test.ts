import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TrophyToast, { SHOW_MS } from './TrophyToast.vue';

const won = { id: 'bigfootSeen', measure: 'sighting', goal: 1, done: 1, won: true } as const;

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('TrophyToast', () => {
  it('celebrates the trophy just won by name', () => {
    const wrapper = mount(TrophyToast, { props: { trophy: won } });

    expect(wrapper.get('[data-testid="trophy-toast"]').text()).toContain('The Last One');
    expect(wrapper.text()).toContain('Nowe osiągnięcie');
  });

  it('is done a few seconds later', async () => {
    const wrapper = mount(TrophyToast, { props: { trophy: won } });

    await vi.advanceTimersByTimeAsync(SHOW_MS);

    expect(wrapper.emitted('done')).toEqual([[]]);
  });

  it('asks to open the trophies when tapped', async () => {
    const wrapper = mount(TrophyToast, { props: { trophy: won } });

    await wrapper.get('[data-testid="trophy-toast"]').trigger('click');

    expect(wrapper.emitted('open')).toEqual([[]]);
  });

  it('shows nothing without a trophy', () => {
    expect(
      mount(TrophyToast, { props: { trophy: null } })
        .find('[data-testid="trophy-toast"]')
        .exists(),
    ).toBe(false);
  });
});
