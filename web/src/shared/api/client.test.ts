import { describe, expect, it } from 'vitest';
import { apiGet, ApiRequestError } from './client';
import { errorMessageKey } from './errorMessages';

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
