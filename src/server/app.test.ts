import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { AttemptLimiter, createInMemoryAuth } from '../modules/auth/index.js';
import { createInMemoryJourneys } from '../modules/journey/index.js';
import { createStaticRouteCatalog } from '../modules/routes/index.js';
import { createWeatherService } from '../modules/weather/index.js';
import { buildApp, type AppDependencies } from './app.js';

const apps: FastifyInstance[] = [];

async function appWith(overrides: Partial<AppDependencies> = {}): Promise<FastifyInstance> {
  const app = await buildApp({
    checkDatabase: async () => {},
    routeCatalog: createStaticRouteCatalog(),
    weather: createWeatherService({
      source: { current: async () => Promise.reject(new Error('offline')) },
      clock: { now: () => new Date(0) },
    }),
    journey: createInMemoryJourneys(),
    auth: createInMemoryAuth(),
    authHttp: { secureCookies: true, limiter: new AttemptLimiter(100, 60_000) },
    ...overrides,
  });
  apps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('GET /api/health', () => {
  it('reports ok when the database answers', async () => {
    const app = await appWith();

    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', database: 'ok' });
  });

  it('returns database_unavailable with 503 when the database does not answer', async () => {
    const app = await appWith({ checkDatabase: async () => Promise.reject(new Error('connection refused')) });

    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(503);
    expect(response.json().error.code).toBe('database_unavailable');
  });
});

describe('GET /api/routes', () => {
  it('lists the Baltic to Santiago route with its length', async () => {
    const app = await appWith();

    const response = await app.inject({ method: 'GET', url: '/api/routes' });

    const [route] = response.json().routes;
    expect(response.statusCode).toBe(200);
    expect(route.id).toBe('baltic-santiago');
    expect(route.lengthKm).toBe(3200);
    expect(route.path[0]).toEqual([18.6466, 54.352]);
    expect(route.path.at(-1)).toEqual([-8.5446, 42.8782]);
  });
});

describe('unknown endpoints', () => {
  it('returns not_found with 404 for an unknown API path', async () => {
    const app = await appWith();

    const response = await app.inject({ method: 'GET', url: '/api/nope' });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('not_found');
  });

  it('returns internal_error with 500 and hides the cause when a handler crashes', async () => {
    const app = await appWith({ routeCatalog: { all: async () => Promise.reject(new Error('disk on fire')) } });

    const response = await app.inject({ method: 'GET', url: '/api/routes' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ error: { code: 'internal_error', message: 'Internal server error' } });
  });
});
