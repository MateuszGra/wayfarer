import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { AttemptLimiter, createInMemoryAuth, type InMemoryAuth } from '../modules/auth/index.js';
import { createInMemoryJourneys } from '../modules/journey/index.js';
import { createInMemoryAchievements } from '../modules/achievements/index.js';
import { createInMemoryNotifications } from '../modules/notifications/index.js';
import { createStaticRouteCatalog } from '../modules/routes/index.js';
import { createWeatherService } from '../modules/weather/index.js';
import { buildApp } from './app.js';

const apps: FastifyInstance[] = [];
let auth: InMemoryAuth;

async function api(limit = 100): Promise<FastifyInstance> {
  auth = createInMemoryAuth();
  const app = await buildApp({
    checkDatabase: async () => {},
    routeCatalog: createStaticRouteCatalog(),
    achievements: createInMemoryAchievements(),
    notifications: createInMemoryNotifications(),
    weather: createWeatherService({
      source: { current: async () => Promise.reject(new Error('offline')) },
      clock: { now: () => new Date(0) },
    }),
    journey: createInMemoryJourneys(),
    auth,
    authHttp: { secureCookies: true, limiter: new AttemptLimiter(limit, 60_000) },
  });
  apps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

const PASSWORD = 'camino2026';
const post = (app: FastifyInstance, url: string, payload: object, cookie?: string) =>
  app.inject({ method: 'POST', url, payload, headers: cookie ? { cookie } : {} });
const register = (app: FastifyInstance, email = 'ana@example.com', password = PASSWORD) =>
  post(app, '/api/auth/register', { email, password });
const me = (app: FastifyInstance, cookie?: string) =>
  app.inject({ method: 'GET', url: '/api/auth/me', headers: cookie ? { cookie } : {} });
/** The `name=value` part of the Set-Cookie header, ready to send back. */
const cookieOf = (response: LightMyRequestResponse): string =>
  String(response.headers['set-cookie']).split(';')[0] ?? '';
const codeOf = (response: LightMyRequestResponse): string => response.json().error.code;
// The fake tokens are numbered: sign-up's confirmation link is token-1, the session it starts is token-2.
const LINK_TOKEN = 'token-1';
/** Signs up and follows the confirmation link; returns the session cookie it set. */
const signedUpCookie = async (app: FastifyInstance): Promise<string> => {
  await register(app);
  return cookieOf(await post(app, '/api/auth/verify-email', { token: LINK_TOKEN }));
};

describe('POST /api/auth/register', () => {
  it('creates the account with 204 and e-mails a confirmation link, without signing in', async () => {
    const app = await api();

    const response = await register(app);

    expect(response.statusCode).toBe(204);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(auth.outbox.map((mail) => mail.subject)).toEqual(['Potwierdź adres e-mail w Wayfarerze']);
  });

  it('returns email_taken with 409 for an address that already has an account', async () => {
    const app = await api();
    await register(app);

    const response = await register(app, 'ANA@example.com');

    expect(response.statusCode).toBe(409);
    expect(codeOf(response)).toBe('email_taken');
  });

  it('returns password_too_short with 400', async () => {
    const app = await api();

    const response = await register(app, 'ana@example.com', '1234567');

    expect(response.statusCode).toBe(400);
    expect(codeOf(response)).toBe('password_too_short');
  });

  it('returns password_breached with 400 for a leaked password', async () => {
    const app = await api();
    auth.breachedList.add('password123');

    const response = await register(app, 'ana@example.com', 'password123');

    expect(response.statusCode).toBe(400);
    expect(codeOf(response)).toBe('password_breached');
  });

  it('returns validation_failed with 400 when a field is missing', async () => {
    const app = await api();

    const response = await post(app, '/api/auth/register', { email: 'ana@example.com' });

    expect(response.statusCode).toBe(400);
    expect(codeOf(response)).toBe('validation_failed');
  });
});

describe('POST /api/auth/login', () => {
  it('signs in with the right password and sets a new session cookie', async () => {
    const app = await api();
    await signedUpCookie(app);

    const response = await post(app, '/api/auth/login', { email: 'ana@example.com', password: PASSWORD });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ account: { email: 'ana@example.com' } });
    expect(cookieOf(response)).toBe('wayfarer_session=token-3');
  });

  it('returns email_not_verified with 403 for an unconfirmed address, without a cookie', async () => {
    const app = await api();
    await register(app);

    const response = await post(app, '/api/auth/login', { email: 'ana@example.com', password: PASSWORD });

    expect(response.statusCode).toBe(403);
    expect(codeOf(response)).toBe('email_not_verified');
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('returns invalid_credentials with 401 for a wrong password, without a cookie', async () => {
    const app = await api();
    await register(app);

    const response = await post(app, '/api/auth/login', { email: 'ana@example.com', password: 'wrong-password' });

    expect(response.statusCode).toBe(401);
    expect(codeOf(response)).toBe('invalid_credentials');
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('returns account_locked with 429 on the fifth wrong password in a row', async () => {
    const app = await api();
    await register(app);
    const wrong = { email: 'ana@example.com', password: 'wrong-password' };
    await Promise.all([1, 2, 3, 4].map(() => post(app, '/api/auth/login', wrong)));

    const response = await post(app, '/api/auth/login', wrong);

    expect(response.statusCode).toBe(429);
    expect(codeOf(response)).toBe('account_locked');
  });

  it('returns too_many_requests with 429 once one address has used up its attempts', async () => {
    const app = await api(2);
    const wrong = { email: 'nobody@example.com', password: 'wrong-password' };
    await post(app, '/api/auth/login', wrong);
    await post(app, '/api/auth/login', wrong);

    const response = await post(app, '/api/auth/login', wrong);

    expect(response.statusCode).toBe(429);
    expect(codeOf(response)).toBe('too_many_requests');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the signed-in account', async () => {
    const app = await api();
    const cookie = await signedUpCookie(app);

    const response = await me(app, cookie);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ account: { email: 'ana@example.com' } });
  });

  it('returns unauthenticated with 401 without a session cookie', async () => {
    const app = await api();

    const response = await me(app);

    expect(response.statusCode).toBe(401);
    expect(codeOf(response)).toBe('unauthenticated');
  });

  it('returns unauthenticated with 401 for a made-up session token', async () => {
    const app = await api();

    expect(codeOf(await me(app, 'wayfarer_session=made-up'))).toBe('unauthenticated');
  });
});

describe('POST /api/auth/logout', () => {
  it('ends the session and clears the cookie', async () => {
    const app = await api();
    const cookie = await signedUpCookie(app);

    const response = await post(app, '/api/auth/logout', {}, cookie);

    expect(response.statusCode).toBe(204);
    expect(response.headers['set-cookie']).toBe(
      'wayfarer_session=; Path=/api; HttpOnly; SameSite=Lax; Max-Age=0; Secure',
    );
    expect((await me(app, cookie)).statusCode).toBe(401);
  });
});

describe('POST /api/auth/password', () => {
  it('changes the password with 204 so the new one signs in', async () => {
    const app = await api();
    const cookie = await signedUpCookie(app);

    const response = await post(
      app,
      '/api/auth/password',
      { currentPassword: PASSWORD, newPassword: 'santiago2026' },
      cookie,
    );
    const relogin = await post(app, '/api/auth/login', { email: 'ana@example.com', password: 'santiago2026' });

    expect(response.statusCode).toBe(204);
    expect(relogin.statusCode).toBe(200);
  });

  it('returns unauthenticated with 401 without a session', async () => {
    const app = await api();

    const response = await post(app, '/api/auth/password', { currentPassword: PASSWORD, newPassword: 'santiago2026' });

    expect(response.statusCode).toBe(401);
    expect(codeOf(response)).toBe('unauthenticated');
  });

  it('returns wrong_password with 403 for a wrong current password', async () => {
    const app = await api();
    const cookie = await signedUpCookie(app);

    const response = await post(
      app,
      '/api/auth/password',
      { currentPassword: 'nope-nope', newPassword: 'santiago2026' },
      cookie,
    );

    expect(response.statusCode).toBe(403);
    expect(codeOf(response)).toBe('wrong_password');
  });

  it('returns password_unchanged with 400 when the new password is the current one', async () => {
    const app = await api();
    const cookie = await signedUpCookie(app);

    const response = await post(
      app,
      '/api/auth/password',
      { currentPassword: PASSWORD, newPassword: PASSWORD },
      cookie,
    );

    expect(response.statusCode).toBe(400);
    expect(codeOf(response)).toBe('password_unchanged');
  });
});

describe('POST /api/auth/verify-email', () => {
  it('confirms the address and signs the player in with a protected cookie', async () => {
    const app = await api();
    await register(app);

    const response = await post(app, '/api/auth/verify-email', { token: LINK_TOKEN });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ account: { email: 'ana@example.com' } });
    expect(response.headers['set-cookie']).toBe(
      'wayfarer_session=token-2; Path=/api; HttpOnly; SameSite=Lax; Max-Age=2592000; Secure',
    );
  });

  it('returns verification_invalid with 400 for an unknown link', async () => {
    const app = await api();

    const response = await post(app, '/api/auth/verify-email', { token: 'made-up' });

    expect(response.statusCode).toBe(400);
    expect(codeOf(response)).toBe('verification_invalid');
  });

  it('returns validation_failed with 400 without a token', async () => {
    const app = await api();

    expect(codeOf(await post(app, '/api/auth/verify-email', {}))).toBe('validation_failed');
  });
});

describe('POST /api/auth/verify-email/code', () => {
  // The fake codes count up from 100001, so sign-up's e-mail carries 100-001.
  const withCode = (app: FastifyInstance, code: string, email = 'ana@example.com') =>
    post(app, '/api/auth/verify-email/code', { email, code });

  it('confirms the address with the code and signs the player in with a protected cookie', async () => {
    const app = await api();
    await register(app);

    const response = await withCode(app, '100-001');

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ account: { email: 'ana@example.com' } });
    expect(response.headers['set-cookie']).toBe(
      'wayfarer_session=token-2; Path=/api; HttpOnly; SameSite=Lax; Max-Age=2592000; Secure',
    );
  });

  it('returns verification_code_invalid with 400 for a wrong code, without a cookie', async () => {
    const app = await api();
    await register(app);

    const response = await withCode(app, '999-999');

    expect(response.statusCode).toBe(400);
    expect(codeOf(response)).toBe('verification_code_invalid');
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('returns validation_failed with 400 for a code that is not six digits', async () => {
    const app = await api();

    expect(codeOf(await withCode(app, '12345'))).toBe('validation_failed');
  });

  it('returns validation_failed with 400 without a code', async () => {
    const app = await api();

    expect(codeOf(await post(app, '/api/auth/verify-email/code', { email: 'ana@example.com' }))).toBe(
      'validation_failed',
    );
  });
});

describe('POST /api/auth/verify-email/resend', () => {
  it('answers 204 and e-mails a new link to an unconfirmed address, without a session', async () => {
    const app = await api();
    await register(app);

    const response = await post(app, '/api/auth/verify-email/resend', { email: 'ana@example.com' });

    expect(response.statusCode).toBe(204);
    expect(auth.outbox).toHaveLength(2);
  });

  it('answers 204 for an address without an account too', async () => {
    const app = await api();

    const response = await post(app, '/api/auth/verify-email/resend', { email: 'nobody@example.com' });

    expect(response.statusCode).toBe(204);
    expect(auth.outbox).toEqual([]);
  });

  it('sends at most three links an hour to one address', async () => {
    const app = await api();
    await register(app);
    auth.outbox.length = 0;

    const ask = () => post(app, '/api/auth/verify-email/resend', { email: 'ana@example.com' });
    await ask();
    await ask();
    await ask();
    await ask();

    expect(auth.outbox).toHaveLength(3);
  });

  it('returns validation_failed with 400 without an address', async () => {
    const app = await api();

    expect(codeOf(await post(app, '/api/auth/verify-email/resend', {}))).toBe('validation_failed');
  });
});

describe('POST /api/auth/password-reset', () => {
  it('answers 204 and e-mails a link to an address with an account', async () => {
    const app = await api();
    await register(app);

    const response = await post(app, '/api/auth/password-reset', { email: 'ana@example.com' });

    expect(response.statusCode).toBe(204);
    expect(auth.outbox.map((mail) => mail.subject)).toContain('Nowe hasło do Wayfarera');
  });

  it('answers 204 for an address without an account too', async () => {
    const app = await api();

    const response = await post(app, '/api/auth/password-reset', { email: 'nobody@example.com' });

    expect(response.statusCode).toBe(204);
    expect(auth.outbox).toEqual([]);
  });

  it('sends at most three links an hour to one address', async () => {
    const app = await api();
    await register(app);
    auth.outbox.length = 0;

    const ask = () => post(app, '/api/auth/password-reset', { email: 'ana@example.com' });
    await ask();
    await ask();
    await ask();
    await ask();

    expect(auth.outbox).toHaveLength(3);
  });
});

describe('POST /api/auth/password-reset/confirm', () => {
  it('sets the new password and signs the player in with a new cookie', async () => {
    const app = await api();
    await signedUpCookie(app);
    await post(app, '/api/auth/password-reset', { email: 'ana@example.com' });

    const response = await post(app, '/api/auth/password-reset/confirm', {
      token: 'token-3',
      newPassword: 'santiago2026',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ account: { email: 'ana@example.com' } });
    expect(cookieOf(response)).toBe('wayfarer_session=token-4');
  });

  it('returns reset_invalid with 400 for an unknown link', async () => {
    const app = await api();

    const response = await post(app, '/api/auth/password-reset/confirm', {
      token: 'made-up',
      newPassword: 'santiago2026',
    });

    expect(response.statusCode).toBe(400);
    expect(codeOf(response)).toBe('reset_invalid');
  });
});
