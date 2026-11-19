import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { useClockHour, type Clock } from './useClockHour';

function mountWithClock(clock: Clock) {
  let hour = { value: -1 };
  const Probe = defineComponent({
    setup() {
      hour = useClockHour(clock, 1_000);
      return () => h('span', String(hour.value));
    },
  });
  return { wrapper: mount(Probe), hour: () => hour.value };
}

describe('useClockHour', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('gives the local time as a fractional hour', () => {
    const { hour } = mountWithClock(() => new Date(2026, 10, 19, 18, 30));

    expect(hour()).toBe(18.5);
  });

  it('follows the clock after each interval', async () => {
    let now = new Date(2026, 10, 19, 23, 45);
    const { hour } = mountWithClock(() => now);

    now = new Date(2026, 10, 20, 0, 15);
    vi.advanceTimersByTime(1_000);
    await nextTick();

    expect(hour()).toBe(0.25);
  });

  it('stops following the clock once unmounted', () => {
    let now = new Date(2026, 10, 19, 6, 0);
    const { wrapper, hour } = mountWithClock(() => now);

    wrapper.unmount();
    now = new Date(2026, 10, 19, 7, 0);
    vi.advanceTimersByTime(1_000);

    expect(hour()).toBe(6);
  });
});
