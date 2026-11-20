import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { AttemptLimiter, createInMemoryAuth } from '../modules/auth/index.js';
import { createInMemoryJourneys, type InMemoryJourneys } from '../modules/journey/index.js';
import { createStaticRouteCatalog } from '../modules/routes/index.js';
import { createWeatherService } from '../modules/weather/index.js';
import { buildApp } from './app.js';

const apps: FastifyInstance[] = [];
let journeys: InMemoryJourneys;

async function api(): Promise<FastifyInstance> {
  // 08:00 in Warsaw on 20 November 2026.
  journeys = createInMemoryJourneys(new Date('2026-11-20T07:00:00Z'));
  const app = await buildApp({
    checkDatabase: async () => {},
    routeCatalog: createStaticRouteCatalog(),
    weather: createWeatherService({
      source: { current: async () => Promise.reject(new Error('offline')) },
      clock: { now: () => new Date(0) },
    }),
    auth: createInMemoryAuth(),
    authHttp: { secureCookies: true, limiter: new AttemptLimiter(100, 60_000) },
    journey: journeys,
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
const send = (app: FastifyInstance, method: 'GET' | 'POST' | 'PUT', url: string, cookie: string, payload?: object) =>
  app.inject({ method, url, headers: { cookie }, ...(payload ? { payload } : {}) });
const plan = { routeId: 'baltic-santiago', dailySteps: 10_000, timeZone: 'Europe/Warsaw' };
const codeOf = (response: LightMyRequestResponse): string => response.json().error.code;

describe('journey API', () => {
  it('returns unauthenticated with 401 without a session', async () => {
    const app = await api();

    const response = await app.inject({ method: 'GET', url: '/api/journey' });

    expect(response.statusCode).toBe(401);
    expect(codeOf(response)).toBe('unauthenticated');
  });

  it('returns journey_not_found with 404 before a journey is planned', async () => {
    const app = await api();
    const cookie = await signedIn(app);

    const response = await send(app, 'GET', '/api/journey', cookie);

    expect(response.statusCode).toBe(404);
    expect(codeOf(response)).toBe('journey_not_found');
  });

  it('plans a journey with 201 and asks for yesterday steps on day 1', async () => {
    const app = await api();
    const cookie = await signedIn(app);

    const response = await send(app, 'POST', '/api/journey', cookie, plan);

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      journey: { routeId: 'baltic-santiago', dailySteps: 10_000, startedOn: null },
      today: { date: '2026-11-20', day: 1, stepsDate: '2026-11-19', stepsEntered: null, walk: null },
    });
  });

  it('returns journey_exists with 409 for a second journey', async () => {
    const app = await api();
    const cookie = await signedIn(app);
    await send(app, 'POST', '/api/journey', cookie, plan);

    const response = await send(app, 'POST', '/api/journey', cookie, plan);

    expect(response.statusCode).toBe(409);
    expect(codeOf(response)).toBe('journey_exists');
  });

  it('returns unknown_route with 400 for a route that does not exist', async () => {
    const app = await api();
    const cookie = await signedIn(app);

    const response = await send(app, 'POST', '/api/journey', cookie, { ...plan, routeId: 'atlantis' });

    expect(response.statusCode).toBe(400);
    expect(codeOf(response)).toBe('unknown_route');
  });

  it('records yesterday steps and sets off on day 1 from the hour they came in', async () => {
    const app = await api();
    const cookie = await signedIn(app);
    await send(app, 'POST', '/api/journey', cookie, plan);

    const response = await send(app, 'PUT', '/api/journey/steps', cookie, { steps: 10_000 });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      journey: { startedOn: '2026-11-20' },
      today: { day: 1, stepsEntered: 10_000, walk: { startHour: 8, endHour: 20 }, kmToday: 7.5 },
    });
  });

  it('returns invalid_steps with 400 above 50 000 steps', async () => {
    const app = await api();
    const cookie = await signedIn(app);
    await send(app, 'POST', '/api/journey', cookie, plan);

    const response = await send(app, 'PUT', '/api/journey/steps', cookie, { steps: 50_001 });

    expect(response.statusCode).toBe(400);
    expect(codeOf(response)).toBe('invalid_steps');
  });

  it('lets the player correct yesterday steps the same day', async () => {
    const app = await api();
    const cookie = await signedIn(app);
    await send(app, 'POST', '/api/journey', cookie, plan);
    await send(app, 'PUT', '/api/journey/steps', cookie, { steps: 10_000 });

    const response = await send(app, 'PUT', '/api/journey/steps', cookie, { steps: 5_000 });

    expect(response.json().today).toMatchObject({ stepsEntered: 5_000, kmToday: 3.75 });
  });

  it('asks again the next day and counts a skipped day as rest', async () => {
    const app = await api();
    const cookie = await signedIn(app);
    await send(app, 'POST', '/api/journey', cookie, plan);
    await send(app, 'PUT', '/api/journey/steps', cookie, { steps: 10_000 });
    journeys.clock.set(new Date('2026-11-22T07:00:00Z'));

    const response = await send(app, 'GET', '/api/journey', cookie);

    expect(response.json().today).toMatchObject({
      day: 3,
      stepsDate: '2026-11-21',
      stepsEntered: null,
      kmAtDayStart: 7.5,
      history: [
        { day: 1, date: '2026-11-19', steps: 10_000 },
        { day: 2, date: '2026-11-20', steps: 0 },
      ],
    });
  });

  it('changes the goal and the route from the settings', async () => {
    const app = await api();
    const cookie = await signedIn(app);
    await send(app, 'POST', '/api/journey', cookie, plan);

    const response = await send(app, 'PUT', '/api/journey', cookie, { routeId: 'baltic-santiago', dailySteps: 12_000 });

    expect(response.statusCode).toBe(200);
    expect(response.json().journey.dailySteps).toBe(12_000);
  });
});
