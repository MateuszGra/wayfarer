import type { Account, AccountId, Email, PasswordHash } from './account.js';
import type { Session, SessionTokenHash } from './session.js';

export interface AccountRepository {
  findByEmail(email: Email): Promise<Account | null>;
  findById(id: AccountId): Promise<Account | null>;
  /** Inserts a new account; returns false when the address is already taken. */
  add(account: Account): Promise<boolean>;
  save(account: Account): Promise<void>;
}

export interface SessionRepository {
  add(session: Session): Promise<void>;
  find(tokenHash: SessionTokenHash): Promise<Session | null>;
  remove(tokenHash: SessionTokenHash): Promise<void>;
  /** Signs the account out everywhere except, when given, the session that asked. */
  removeAllFor(accountId: AccountId, except?: SessionTokenHash): Promise<void>;
}

export interface PasswordHasher {
  hash(password: string): Promise<PasswordHash>;
  /**
   * Checks a password against a stored hash. With no hash (an unknown address) it still does the same work
   * and returns false, so the response time doesn't reveal which addresses have accounts.
   */
  verify(password: string, hash: PasswordHash | null): Promise<boolean>;
}

/** Whether a password appears in known breaches or among the most common ones. */
export interface BreachedPasswords {
  isBreached(password: string): Promise<boolean>;
}

/** A new random session token and its hash; the token goes to the player, the hash to the database. */
export interface SessionTokens {
  issue(): { readonly token: string; readonly hash: SessionTokenHash };
  hashOf(token: string): SessionTokenHash;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  accountId(): AccountId;
}
