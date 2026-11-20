import { describe, expect, it } from 'vitest';
import { DEFAULT_REGION } from '../domain/region';
import { createOpenMeteo } from './openMeteo';

const answering = (body: unknown, calls: string[] = [], status = 200): typeof fetch =>
  (async (url: string | URL | Request) => {
    calls.push(String(url));
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;

describe('Open-Meteo source', () => {
  it('asks for three current values at the region, rounded to about a kilometre', async () => {
    const calls: string[] = [];
    const body = { current: { time: '2026-11-20T12:00', weather_code: 3, temperature_2m: 5.1, wind_speed_10m: 9.4 } };

    await createOpenMeteo(answering(body, calls)).current({ ...DEFAULT_REGION, latitude: 54.4637, longitude: 17.0281 });

    expect(calls).toEqual([
      'https://api.open-meteo.com/v1/forecast?latitude=54.46&longitude=17.03&current=weather_code%2Ctemperature_2m%2Cwind_speed_10m&timezone=UTC',
    ]);
  });

  it('reads the code, temperature, wind and the time it was measured', async () => {
    const body = { current: { time: '2026-11-20T12:00', weather_code: 3, temperature_2m: 5.1, wind_speed_10m: 9.4 } };

    expect(await createOpenMeteo(answering(body)).current(DEFAULT_REGION)).toEqual({
      code: 3,
      temperatureC: 5.1,
      windKmh: 9.4,
      observedAt: new Date('2026-11-20T12:00:00Z'),
    });
  });

  it('fails on an error status', async () => {
    await expect(createOpenMeteo(answering({}, [], 503)).current(DEFAULT_REGION)).rejects.toThrow(
      'Open-Meteo answered 503',
    );
  });

  it('fails on an answer without the values it asked for', async () => {
    await expect(
      createOpenMeteo(answering({ current: { time: '2026-11-20T12:00' } })).current(DEFAULT_REGION),
    ).rejects.toThrow('unexpected response');
  });
});
