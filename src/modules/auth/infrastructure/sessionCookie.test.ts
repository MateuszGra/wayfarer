import { describe, expect, it } from 'vitest';
import { clearedSessionCookie, readSessionToken, sessionCookie } from './sessionCookie';

describe('session cookie', () => {
  it('reads the session token among other cookies', () => {
    expect(readSessionToken('theme=dark; wayfarer_session=abc-123_x; lang=pl')).toBe('abc-123_x');
  });

  it('reads no token from a request without cookies', () => {
    expect(readSessionToken(undefined)).toBeNull();
  });

  it('reads no token from an empty session cookie', () => {
    expect(readSessionToken('wayfarer_session=')).toBeNull();
  });

  it('keeps the token from page scripts and other sites, for thirty days, over https', () => {
    expect(sessionCookie('abc', true)).toBe(
      'wayfarer_session=abc; Path=/api; HttpOnly; SameSite=Lax; Max-Age=2592000; Secure',
    );
  });

  it('leaves out Secure for local development over http', () => {
    expect(sessionCookie('abc', false)).not.toContain('Secure');
  });

  it('expires the cookie on sign-out', () => {
    expect(clearedSessionCookie(true)).toBe('wayfarer_session=; Path=/api; HttpOnly; SameSite=Lax; Max-Age=0; Secure');
  });
});
