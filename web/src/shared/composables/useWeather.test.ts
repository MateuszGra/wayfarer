import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { useWeather, WEATHER_REFRESH_MS } from './useWeather';

const api = vi.hoisted(() => ({ fetchWeather: vi.fn() }));
vi.mock('@/shared/api/weather', () => api);

const reading = (temperatureC: number) => ({
  region: 'Słupsk',
  weather: { sky: 'clear', precipitation: 'none', storm: false, wind: 'calm', frost: false },
  temperatureC,
  windKmh: 5,
  observedAt: '2026-11-20T12:00:00.000Z',
});
function mountWeather() {
  let weather!: ReturnType<typeof useWeather>['weather'];
  const wrapper = mount(defineComponent({ setup: () => ((weather = useWeather().weather), () => h('div')) }));
  return { wrapper, temperature: () => weather.value?.temperatureC };
}

beforeEach(() => {
  vi.useFakeTimers();
  api.fetchWeather.mockReset();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('useWeather', () => {
  it('loads the weather when the game opens', async () => {
    api.fetchWeather.mockResolvedValue(reading(4));
    const { temperature } = mountWeather();
    await flushPromises();

    expect(temperature()).toBe(4);
  });

  it('asks again after half an hour, not before', async () => {
    api.fetchWeather.mockResolvedValue(reading(4));
    mountWeather();
    await vi.advanceTimersByTimeAsync(WEATHER_REFRESH_MS - 1);
    const before = api.fetchWeather.mock.calls.length;

    await vi.advanceTimersByTimeAsync(1);

    expect(before).toBe(1);
    expect(api.fetchWeather).toHaveBeenCalledTimes(2);
  });

  it('keeps the last weather when an update fails', async () => {
    api.fetchWeather.mockResolvedValueOnce(reading(4)).mockRejectedValue(new Error('offline'));
    const { temperature } = mountWeather();
    await flushPromises();

    await vi.advanceTimersByTimeAsync(WEATHER_REFRESH_MS);

    expect(temperature()).toBe(4);
  });
});
