import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { createInMemoryAchievements } from '../modules/achievements/index.js';
import { AttemptLimiter, createInMemoryAuth } from '../modules/auth/index.js';
import { createInMemoryJourneys } from '../modules/journey/index.js';
import { createInMemoryNotifications } from '../modules/notifications/index.js';
import { createStaticRouteCatalog } from '../modules/routes/index.js';
import { createWeatherService } from '../modules/weather/index.js';
import { buildApp } from './app.js';

const apps: FastifyInstance[] = [];
async function api(): Promise<FastifyInstance> {
  const app = await buildApp({
    checkDatabase: async () => {},
    routeCatalog: createStaticRouteCatalog(),
    achievements: createInMemoryAchievements(),
    notifications: createInMemoryNotifications(),
    weather: createWeatherService({
      source: { current: async () => Promise.reject(new Error('offline')) },
      clock: { now: () => new Date(0) },
    }),
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
async function signedIn(app: FastifyInstance, email = 'ana@example.com'): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email, password: 'camino2026' },
  });
  return String(response.headers['set-cookie']).split(';')[0] ?? '';
}
const URL = '/api/notifications/settings';

describe('notification settings API', () => {
  it('has step reminders on for a new player', async () => {
    const app = await api();
    const cookie = await signedIn(app);

    const response = await app.inject({ method: 'GET', url: URL, headers: { cookie } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ stepReminders: true });
  });

  it('keeps step reminders off once the player turns them off', async () => {
    const app = await api();
    const cookie = await signedIn(app);
    await app.inject({ method: 'PUT', url: URL, headers: { cookie }, payload: { stepReminders: false } });

    const response = await app.inject({ method: 'GET', url: URL, headers: { cookie } });

    expect(response.json()).toEqual({ stepReminders: false });
  });

  it('changes only the signed-in player’s settings', async () => {
    const app = await api();
    await app.inject({
      method: 'PUT',
      url: URL,
      headers: { cookie: await signedIn(app, 'ana@example.com') },
      payload: { stepReminders: false },
    });

    const response = await app.inject({
      method: 'GET',
      url: URL,
      headers: { cookie: await signedIn(app, 'jan@example.com') },
    });

    expect(response.json()).toEqual({ stepReminders: true });
  });

  it('returns validation_failed with 400 when stepReminders is not true or false', async () => {
    const app = await api();
    const cookie = await signedIn(app);

    const response = await app.inject({
      method: 'PUT',
      url: URL,
      headers: { cookie },
      payload: { stepReminders: 'no' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('validation_failed');
  });

  it('returns unauthenticated with 401 without a session', async () => {
    const app = await api();

    const response = await app.inject({ method: 'GET', url: URL });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('unauthenticated');
  });
});
