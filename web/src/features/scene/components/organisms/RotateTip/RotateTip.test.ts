import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { setSplashPlayingForTests } from '@/shared/composables/useSplash';
import RotateTip, { resetRotateTipForTests, SHOW_AFTER_MS, VISIBLE_MS } from './RotateTip.vue';

// Whether the phone is held upright: our own composable, driven by the test.
const upright = ref(true);
vi.mock('@/shared/composables/useUprightPhone', () => ({ useUprightPhone: () => upright }));

const tipShown = (wrapper: ReturnType<typeof mount>) => wrapper.find('[data-testid="rotate-tip"]').exists();

beforeEach(() => {
  vi.useFakeTimers();
  upright.value = true;
  setSplashPlayingForTests(false);
  resetRotateTipForTests();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('RotateTip', () => {
  it('suggests turning an upright phone a few seconds after the game opens', async () => {
    const wrapper = mount(RotateTip);
    const before = tipShown(wrapper);

    await vi.advanceTimersByTimeAsync(SHOW_AFTER_MS);

    expect(before).toBe(false);
    expect(tipShown(wrapper)).toBe(true);
  });

  it('goes away on its own a few seconds later', async () => {
    const wrapper = mount(RotateTip);
    await vi.advanceTimersByTimeAsync(SHOW_AFTER_MS);

    await vi.advanceTimersByTimeAsync(VISIBLE_MS);

    expect(tipShown(wrapper)).toBe(false);
  });

  it('waits for the splash screen to finish first', async () => {
    setSplashPlayingForTests(true);
    const wrapper = mount(RotateTip);
    await vi.advanceTimersByTimeAsync(SHOW_AFTER_MS);
    const duringSplash = tipShown(wrapper);

    setSplashPlayingForTests(false);
    await vi.advanceTimersByTimeAsync(SHOW_AFTER_MS);

    expect(duringSplash).toBe(false);
    expect(tipShown(wrapper)).toBe(true);
  });

  it('never shows on a phone held sideways', async () => {
    upright.value = false;
    const wrapper = mount(RotateTip);

    await vi.advanceTimersByTimeAsync(SHOW_AFTER_MS + VISIBLE_MS);

    expect(tipShown(wrapper)).toBe(false);
  });

  it('hides at once when the phone is turned', async () => {
    const wrapper = mount(RotateTip);
    await vi.advanceTimersByTimeAsync(SHOW_AFTER_MS);

    upright.value = false;
    await nextTick();

    expect(tipShown(wrapper)).toBe(false);
  });

  it('plays only once until the page is reloaded', async () => {
    mount(RotateTip);
    await vi.advanceTimersByTimeAsync(SHOW_AFTER_MS + VISIBLE_MS);

    const again = mount(RotateTip);
    await vi.advanceTimersByTimeAsync(SHOW_AFTER_MS);

    expect(tipShown(again)).toBe(false);
  });
});
