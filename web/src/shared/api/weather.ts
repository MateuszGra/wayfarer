import type { WeatherResponse } from '@shared/api/contracts';
import { apiGet } from '@/shared/api/client';

/** The current weather of the player's region. */
export function fetchWeather(): Promise<WeatherResponse> {
  return apiGet<WeatherResponse>('/weather');
}
