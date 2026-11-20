import { describe, expect, it } from 'vitest';
import type { Observation, WeatherSource } from '../domain/ports';
import { DEFAULT_REGION } from '../domain/region';
import { createWeatherService, WEATHER_TTL_MS } from './weatherService';

const START = new Date('2026-11-20T12:00:00Z');
const rainy: Observation = { code: 63, temperatureC: 4.2, windKmh: 18, observedAt: START };

function setup(results: (Observation | Error)[]) {
  let now = START;
  let calls = 0;
  const source: WeatherSource = {
    current: async () => {
      const next = results[Math.min(calls++, results.length - 1)];
      if (!next || next instanceof Error) throw next ?? new Error('none');
      return next;
    },
  };
  const service = createWeatherService({ source, clock: { now: () => now } });
  return { service, calls: () => calls, later: (ms: number) => (now = new Date(START.getTime() + ms)) };
}

describe('weather service', () => {
  it('gives the scene weather, temperature and wind of the region', async () => {
    const { service } = setup([rainy]);

    expect(await service.current(DEFAULT_REGION)).toEqual({
      region: 'Słupsk',
      weather: { sky: 'overcast', precipitation: 'rain', storm: false, wind: 'breeze', frost: false },
      temperatureC: 4.2,
      windKmh: 18,
      observedAt: '2026-11-20T12:00:00.000Z',
    });
  });

  it('asks the source once an hour per region', async () => {
    const { service, calls, later } = setup([rainy]);
    await service.current(DEFAULT_REGION);

    later(WEATHER_TTL_MS - 1);
    await service.current(DEFAULT_REGION);

    expect(calls()).toBe(1);
  });

  it('asks again once the hour is up', async () => {
    const { service, calls, later } = setup([rainy]);
    await service.current(DEFAULT_REGION);

    later(WEATHER_TTL_MS);
    await service.current(DEFAULT_REGION);

    expect(calls()).toBe(2);
  });

  it('keeps the last known weather when the source fails', async () => {
    const { service, later } = setup([rainy, new Error('offline')]);
    await service.current(DEFAULT_REGION);
    later(WEATHER_TTL_MS);

    await expect(service.current(DEFAULT_REGION)).resolves.toMatchObject({ temperatureC: 4.2 });
  });

  it('reports weather_unavailable when the source fails and nothing is known yet', async () => {
    const { service } = setup([new Error('offline')]);

    await expect(service.current(DEFAULT_REGION)).rejects.toMatchObject({ code: 'weather_unavailable' });
  });

  it('sends one request for players asking at the same moment', async () => {
    const { service, calls } = setup([rainy]);

    await Promise.all([service.current(DEFAULT_REGION), service.current(DEFAULT_REGION)]);

    expect(calls()).toBe(1);
  });
});
