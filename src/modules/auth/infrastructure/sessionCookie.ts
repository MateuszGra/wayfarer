import { SESSION_MS } from '../domain/session.js';

export const SESSION_COOKIE = 'wayfarer_session';

/** The session token from a Cookie header, or null. */
export function readSessionToken(cookieHeader: string | undefined): string | null {
  for (const part of (cookieHeader ?? '').split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === SESSION_COOKIE) return value.join('=') || null;
  }
  return null;
}

/**
 * HttpOnly keeps the token away from page scripts; SameSite=Lax keeps other sites' forms from using it;
 * Path=/api sends it only to the API. `secure` is off only for local development over plain http.
 */
export function sessionCookie(token: string, secure: boolean): string {
  const maxAge = Math.floor(SESSION_MS / 1000);
  return `${SESSION_COOKIE}=${token}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

export function clearedSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; Path=/api; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
}
