import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SplashLoader from './SplashLoader.vue';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('SplashLoader', () => {
  it('cuts one hole for every footprint of the three walkers', () => {
    const wrapper = mount(SplashLoader);

    expect(wrapper.findAll('.splash-loader__step')).toHaveLength(12);
  });

  it('starts spreading the splash 0.15 s after the last footprint', async () => {
    const wrapper = mount(SplashLoader);

    // The third walker's last footprint lands at 1350 ms.
    await vi.advanceTimersByTimeAsync(1499);
    const beforeReveal = wrapper.classes('splash-loader--revealing');
    await vi.advanceTimersByTimeAsync(1);

    expect(beforeReveal).toBe(false);
    expect(wrapper.classes()).toContain('splash-loader--revealing');
  });

  it('is over two seconds after it started', async () => {
    const wrapper = mount(SplashLoader);

    await vi.advanceTimersByTimeAsync(2000);

    expect(wrapper.emitted('done')).toEqual([[]]);
  });

  it('takes the time spent loading the page off the splash, ending two seconds after opening', async () => {
    const wrapper = mount(SplashLoader, { props: { elapsedMs: 500 } });

    await vi.advanceTimersByTimeAsync(1500);

    expect(wrapper.emitted('done')).toEqual([[]]);
  });

  it('spreads the splash at once when loading took longer than the walk', async () => {
    const wrapper = mount(SplashLoader, { props: { elapsedMs: 1600 } });

    await vi.advanceTimersByTimeAsync(0);

    expect(wrapper.classes()).toContain('splash-loader--revealing');
  });

  it('skips straight to spreading the splash when tapped', async () => {
    const wrapper = mount(SplashLoader);

    await wrapper.trigger('click');
    await vi.advanceTimersByTimeAsync(500);

    expect(wrapper.emitted('done')).toEqual([[]]);
  });

  it('shows everything at once and only fades the black, sooner, with reduced motion', async () => {
    const wrapper = mount(SplashLoader, { props: { reducedMotion: true } });

    await vi.advanceTimersByTimeAsync(800);

    expect(wrapper.emitted('done')).toEqual([[]]);
  });
});
