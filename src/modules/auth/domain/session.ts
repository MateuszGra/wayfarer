import type { AccountId } from './account.js';

/** SHA-256 of the session token. Only the hash is stored, so a copy of the database can't sign anyone in. */
export type SessionTokenHash = string & { readonly __brand: 'SessionTokenHash' };

// A session lasts 30 days from sign-in; a walking game is opened daily and shouldn't ask for the password often.
export const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

export interface Session {
  readonly tokenHash: SessionTokenHash;
  readonly accountId: AccountId;
  readonly expiresAt: Date;
}

export function startSession(tokenHash: SessionTokenHash, accountId: AccountId, now: Date): Session {
  return { tokenHash, accountId, expiresAt: new Date(now.getTime() + SESSION_MS) };
}

export function isSessionActive(session: Session, now: Date): boolean {
  return now < session.expiresAt;
}
