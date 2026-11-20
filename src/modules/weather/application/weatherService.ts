import type { WeatherResponse } from '../../../shared/api/contracts.js';
import { weatherOf } from '../../../shared/weather/weather.js';
import { WeatherError } from '../domain/errors.js';
import type { Clock, Observation, WeatherSource } from '../domain/ports.js';
import type { Region } from '../domain/region.js';

// The sky changes slowly and the source is shared by everyone in a region: one fetch per region every
// half hour keeps the scene close to the window without asking Open-Meteo for every player.
export const WEATHER_TTL_MS = 30 * 60 * 1000;

export interface WeatherDependencies {
  readonly source: WeatherSource;
  readonly clock: Clock;
}

interface Cached {
  readonly fetchedAt: number;
  readonly observation: Observation;
}

/** Current weather per region, cached in memory (one process serves the game; a restart refetches). */
export function createWeatherService(deps: WeatherDependencies) {
  const cache = new Map<string, Cached>();
  // Players opening the game together when the half hour runs out share one request instead of each
  // sending their own.
  const pending = new Map<string, Promise<Cached>>();
  const refresh = (region: Region, now: number): Promise<Cached> => {
    let request = pending.get(region.id);
    if (!request) {
      request = deps.source
        .current(region)
        .then((observation) => {
          const fresh = { fetchedAt: now, observation };
          cache.set(region.id, fresh);
          return fresh;
        })
        .finally(() => pending.delete(region.id));
      pending.set(region.id, request);
    }
    return request;
  };
  return {
    async current(region: Region): Promise<WeatherResponse> {
      const now = deps.clock.now().getTime();
      let cached = cache.get(region.id);
      if (!cached || now - cached.fetchedAt >= WEATHER_TTL_MS) {
        try {
          cached = await refresh(region, now);
        } catch {
          // An outage keeps the last known weather on screen rather than none.
          if (!cached) throw new WeatherError();
        }
      }
      const { observation } = cached;
      return {
        region: region.name,
        weather: weatherOf(observation),
        temperatureC: observation.temperatureC,
        windKmh: observation.windKmh,
        observedAt: observation.observedAt.toISOString(),
      };
    },
  };
}

export type WeatherService = ReturnType<typeof createWeatherService>;
