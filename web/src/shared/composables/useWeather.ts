import { onBeforeUnmount, onMounted, readonly, ref } from 'vue';
import type { WeatherResponse } from '@shared/api/contracts';
import { fetchWeather } from '@/shared/api/weather';

// The server refreshes a region's weather every half hour; asking more often would only get the same.
export const WEATHER_REFRESH_MS = 30 * 60 * 1000;

const current = ref<WeatherResponse | null>(null);

/**
 * The weather where the player is, loaded when the game opens and refreshed every half hour while it
 * stays open, and again when the game comes back from the background. Without it (no network, the
 * service down) the scene keeps its own weather, so failures are quiet.
 */
export function useWeather() {
  const load = async (): Promise<void> => {
    try {
      current.value = await fetchWeather();
    } catch {
      // Keep what we had: a missing update must not change the sky.
    }
  };
  let timer: ReturnType<typeof setInterval> | undefined;
  const onVisible = (): void => {
    if (document.visibilityState === 'visible') void load();
  };
  onMounted(() => {
    void load();
    timer = setInterval(() => void load(), WEATHER_REFRESH_MS);
    document.addEventListener('visibilitychange', onVisible);
  });
  onBeforeUnmount(() => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisible);
  });
  return { weather: readonly(current) };
}
