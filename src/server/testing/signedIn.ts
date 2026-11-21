import type { FastifyInstance } from 'fastify';
import type { InMemoryAuth } from '../../modules/auth/index.js';

/**
 * Signs a player up and follows the confirmation link from the fake outbox, as a player would; returns the
 * `name=value` session cookie, ready to send back. For API tests of routes behind a session.
 */
export async function signedIn(app: FastifyInstance, auth: InMemoryAuth, email = 'ana@example.com'): Promise<string> {
  await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email, password: 'camino2026' } });
  const token = /token=([^\s&]+)/.exec(auth.outbox.at(-1)?.text ?? '')?.[1];
  if (!token) throw new Error(`No confirmation link was e-mailed to ${email}`);
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/verify-email',
    payload: { token: decodeURIComponent(token) },
  });
  return String(response.headers['set-cookie']).split(';')[0] ?? '';
}
