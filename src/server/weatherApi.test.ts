import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { AttemptLimiter, createInMemoryAuth, type InMemoryAuth } from '../modules/auth/index.js';
import { createInMemoryJourneys } from '../modules/journey/index.js';
import { createInMemoryAchievements } from '../modules/achievements/index.js';
import { createInMemoryNotifications } from '../modules/notifications/index.js';
import { createStaticRouteCatalog } from '../modules/routes/index.js';
import { createWeatherService } from '../modules/weather/index.js';
import { buildApp } from './app.js';
import { signedIn } from './testing/signedIn.js';

const apps: FastifyInstance[] = [];
let auth: InMemoryAuth;

async function api(source: Parameters<typeof createWeatherService>[0]['source']): Promise<FastifyInstance> {
  auth = createInMemoryAuth();
  const app = await buildApp({
    checkDatabase: async () => {},
    routeCatalog: createStaticRouteCatalog(),
    achievements: createInMemoryAchievements(),
    notifications: createInMemoryNotifications(),
    weather: createWeatherService({ source, clock: { now: () => new Date('2026-11-20T12:00:00Z') } }),
    auth,
    authHttp: { secureCookies: true, limiter: new AttemptLimiter(100, 60_000) },
    journey: createInMemoryJourneys(),
  });
  apps.push(app);
  return app;
}
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});
const snowy = {
  current: async () => ({ code: 73, temperatureC: -2, windKmh: 40, observedAt: new Date('2026-11-20T11:45:00Z') }),
};

describe('GET /api/weather', () => {
  it('gives the weather of the player region', async () => {
    const app = await api(snowy);
    const cookie = await signedIn(app, auth);

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
    const cookie = await signedIn(app, auth);

    const response = await app.inject({ method: 'GET', url: '/api/weather', headers: { cookie } });

    expect(response.statusCode).toBe(503);
    expect(response.json().error.code).toBe('weather_unavailable');
  });
});
