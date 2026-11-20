import type { Observation, WeatherSource } from '../domain/ports.js';
import type { Region } from '../domain/region.js';

const URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 5000;

/**
 * Current weather from Open-Meteo (no key). Only the region's coordinates, rounded to 0.01° (about 1 km),
 * leave the server, and only the three values the game uses are asked for.
 */
export function createOpenMeteo(fetcher: typeof fetch = fetch): WeatherSource {
  return {
    async current(region: Region): Promise<Observation> {
      const query = new URLSearchParams({
        latitude: region.latitude.toFixed(2),
        longitude: region.longitude.toFixed(2),
        current: 'weather_code,temperature_2m,wind_speed_10m',
        timezone: 'UTC',
      });
      const response = await fetcher(`${URL}?${query}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) throw new Error(`Open-Meteo answered ${response.status}`);
      const current = ((await response.json()) as { current?: Record<string, unknown> }).current;
      const code = current?.['weather_code'],
        temperature = current?.['temperature_2m'],
        wind = current?.['wind_speed_10m'];
      const time = current?.['time'];
      if (
        typeof code !== 'number' ||
        typeof temperature !== 'number' ||
        typeof wind !== 'number' ||
        typeof time !== 'string'
      ) {
        throw new Error('Open-Meteo: unexpected response');
      }
      return { code, temperatureC: temperature, windKmh: wind, observedAt: new Date(`${time}Z`) };
    },
  };
}
