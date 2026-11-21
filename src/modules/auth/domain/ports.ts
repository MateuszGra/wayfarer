import type { Account, AccountId, Email, PasswordHash } from './account.js';
import type { EmailVerification } from './emailVerification.js';
import type { OneTimeLink } from './oneTimeLink.js';
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

/** Password links. */
export interface OneTimeLinkRepository {
  add(link: OneTimeLink): Promise<void>;
  find(tokenHash: SessionTokenHash): Promise<OneTimeLink | null>;
  /** Drops every link of the account: once one is used, or when a new one replaces them. */
  removeAllFor(accountId: AccountId): Promise<void>;
}

/** Confirmation e-mails; an account has at most one, as a new one replaces the old. */
export interface EmailVerificationRepository {
  add(verification: EmailVerification): Promise<void>;
  find(tokenHash: SessionTokenHash): Promise<EmailVerification | null>;
  findFor(accountId: AccountId): Promise<EmailVerification | null>;
  /**
   * Counts one try of the code before it is compared, and says whether the try is within `max`. Counting
   * first, in one step, keeps tries sent at the same moment from slipping past the limit.
   */
  countCodeAttempt(tokenHash: SessionTokenHash, max: number): Promise<boolean>;
  /** Drops the account's confirmation: once it is used, or when a new one replaces it. */
  removeAllFor(accountId: AccountId): Promise<void>;
}

/** Random six-digit codes for confirmation e-mails. */
export interface VerificationCodes {
  issue(): string;
}

export interface Mail {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
}

/** Sends e-mail (the SMTP mailbox in production). */
export interface Mailer {
  send(mail: Mail): Promise<void>;
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
