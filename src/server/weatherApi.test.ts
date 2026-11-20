import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { AttemptLimiter, createInMemoryAuth } from '../modules/auth/index.js';
import { createInMemoryJourneys } from '../modules/journey/index.js';
import { createStaticRouteCatalog } from '../modules/routes/index.js';
import { createWeatherService } from '../modules/weather/index.js';
import { buildApp } from './app.js';

const apps: FastifyInstance[] = [];
async function api(source: Parameters<typeof createWeatherService>[0]['source']): Promise<FastifyInstance> {
  const app = await buildApp({
    checkDatabase: async () => {},
    routeCatalog: createStaticRouteCatalog(),
    weather: createWeatherService({ source, clock: { now: () => new Date('2026-11-20T12:00:00Z') } }),
    auth: createInMemoryAuth(),
    authHttp: { secureCookies: true, limiter: new AttemptLimiter(100, 60_000) },
    journey: createInMemoryJourneys(),
  });
  apps.push(app);
  return app;
}
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});
async function signedIn(app: FastifyInstance): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email: 'ana@example.com', password: 'camino2026' },
  });
  return String(response.headers['set-cookie']).split(';')[0] ?? '';
}
const snowy = {
  current: async () => ({ code: 73, temperatureC: -2, windKmh: 40, observedAt: new Date('2026-11-20T11:45:00Z') }),
};

describe('GET /api/weather', () => {
  it('gives the weather of the player region', async () => {
    const app = await api(snowy);
    const cookie = await signedIn(app);

    const response = await app.inject({ method: 'GET', url: '/api/weather', headers: { cookie } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      region: 'Słupsk',
      weather: { sky: 'overcast', precipitation: 'snow', storm: false, wind: 'strong', frost: true },
      temperatureC: -2,
      windKmh: 40,
      observedAt: '2026-11-20T11:45:00.000Z',
    });
  });

  it('returns unauthenticated with 401 without a session', async () => {
    const app = await api(snowy);

    const response = await app.inject({ method: 'GET', url: '/api/weather' });

    expect(response.statusCode).toBe(401);
  });

  it('returns weather_unavailable with 503 when there is no weather to give', async () => {
    const app = await api({ current: async () => Promise.reject(new Error('offline')) });
    const cookie = await signedIn(app);

    const response = await app.inject({ method: 'GET', url: '/api/weather', headers: { cookie } });

    expect(response.statusCode).toBe(503);
    expect(response.json().error.code).toBe('weather_unavailable');
  });
});
