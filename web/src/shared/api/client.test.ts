import { describe, expect, it } from 'vitest';
import { apiGet, apiPost, ApiRequestError } from './client';
import { apiErrorMessage, errorMessageKey } from './errorMessages';

const respond =
  (status: number, body: unknown): typeof fetch =>
  async () =>
    new Response(JSON.stringify(body), { status });

describe('apiGet', () => {
  it('returns the parsed body of a successful response', async () => {
    await expect(apiGet('/routes', respond(200, { routes: [] }))).resolves.toEqual({ routes: [] });
  });

  it('throws an error carrying the API error code', async () => {
    const failing = respond(503, { error: { code: 'database_unavailable', message: 'Database is unavailable' } });

    await expect(apiGet('/health', failing)).rejects.toMatchObject({ code: 'database_unavailable', status: 503 });
  });

  it('throws an error without a code when the network fails', async () => {
    const offline: typeof fetch = async () => Promise.reject(new TypeError('Failed to fetch'));

    await expect(apiGet('/health', offline)).rejects.toEqual(new ApiRequestError(null, null));
  });
});

describe('apiPost', () => {
  it('sends the body as JSON', async () => {
    const sent: RequestInit[] = [];
    const recording: typeof fetch = async (_url, init) => {
      sent.push(init ?? {});
      return new Response(null, { status: 204 });
    };

    await apiPost('/auth/login', { email: 'ana@example.com' }, recording);

    expect(sent[0]).toMatchObject({ method: 'POST', body: '{"email":"ana@example.com"}' });
  });

  it('resolves to undefined for a 204 answer', async () => {
    const noContent: typeof fetch = async () => new Response(null, { status: 204 });

    await expect(apiPost('/auth/logout', {}, noContent)).resolves.toBeUndefined();
  });
});

describe('apiErrorMessage', () => {
  it('fills the password length into the message for a too short password', () => {
    expect(apiErrorMessage(new ApiRequestError('password_too_short', 400))).toBe(
      'Hasło musi mieć co najmniej 8 znaków.',
    );
  });

  it('says the connection is down when the call never arrived', () => {
    expect(apiErrorMessage(new ApiRequestError(null, null))).toBe('Brak połączenia z internetem.');
  });

  it('falls back to a generic message for something that is not an API error', () => {
    expect(apiErrorMessage(new Error('boom'))).toBe('Wystąpił nieoczekiwany błąd.');
  });
});

describe('errorMessageKey', () => {
  it('maps a known code to its message', () => {
    expect(errorMessageKey('database_unavailable')).toBe('errors.database_unavailable');
  });

  it('falls back to a generic message for an unknown code', () => {
    expect(errorMessageKey('teapot')).toBe('errors.unknown');
  });

  it('uses the network message when there is no code', () => {
    expect(errorMessageKey(null)).toBe('errors.network');
  });
});
