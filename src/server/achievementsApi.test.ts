import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { createInMemoryAchievements } from '../modules/achievements/index.js';
import { createInMemoryNotifications } from '../modules/notifications/index.js';
import { AttemptLimiter, createInMemoryAuth, type InMemoryAuth } from '../modules/auth/index.js';
import { createInMemoryJourneys } from '../modules/journey/index.js';
import { createStaticRouteCatalog } from '../modules/routes/index.js';
import { createWeatherService } from '../modules/weather/index.js';
import { buildApp } from './app.js';
import { signedIn } from './testing/signedIn.js';

const apps: FastifyInstance[] = [];
let auth: InMemoryAuth;

async function api(): Promise<FastifyInstance> {
  auth = createInMemoryAuth();
  const app = await buildApp({
    checkDatabase: async () => {},
    routeCatalog: createStaticRouteCatalog(),
    achievements: createInMemoryAchievements(new Date('2026-11-20T19:30:00Z')),
    notifications: createInMemoryNotifications(),
    weather: createWeatherService({
      source: { current: async () => Promise.reject(new Error('offline')) },
      clock: { now: () => new Date(0) },
    }),
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
const put = (app: FastifyInstance, event: string, cookie: string) =>
  app.inject({ method: 'PUT', url: `/api/achievements/world/${event}`, headers: { cookie } });

describe('world events API', () => {
  it('records a sighting and lists it with when it was seen', async () => {
    const app = await api();
    const cookie = await signedIn(app, auth);

    const response = await put(app, 'bigfootSeen', cookie);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ seen: [{ id: 'bigfootSeen', seenAt: '2026-11-20T19:30:00.000Z' }] });
  });

  it('keeps one sighting when the same event is seen again', async () => {
    const app = await api();
    const cookie = await signedIn(app, auth);
    await put(app, 'pikeCaught', cookie);

    await put(app, 'pikeCaught', cookie);
    const response = await app.inject({ method: 'GET', url: '/api/achievements/world', headers: { cookie } });

    expect(response.json().seen).toHaveLength(1);
  });

  it('shows each player only their own sightings', async () => {
    const app = await api();
    await put(app, 'bigfootSeen', await signedIn(app, auth, 'ana@example.com'));
    const other = await signedIn(app, auth, 'jan@example.com');

    const response = await app.inject({ method: 'GET', url: '/api/achievements/world', headers: { cookie: other } });

    expect(response.json()).toEqual({ seen: [] });
  });

  it('returns validation_failed with 400 for an event the game does not have', async () => {
    const app = await api();
    const cookie = await signedIn(app, auth);

    const response = await put(app, 'unicornSeen', cookie);

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('validation_failed');
  });

  it('returns unauthenticated with 401 without a session', async () => {
    const app = await api();

    const response = await app.inject({ method: 'GET', url: '/api/achievements/world' });

    expect(response.statusCode).toBe(401);
  });

  it('records a bird species that perched', async () => {
    const app = await api();
    const cookie = await signedIn(app, auth);

    const response = await put(app, 'bird:robin', cookie);

    expect(response.json().seen).toEqual([{ id: 'bird:robin', seenAt: '2026-11-20T19:30:00.000Z' }]);
  });
});
