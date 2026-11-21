import { normalizeEmail } from '../../../shared/auth/email.js';

/** A stored password hash in PHC string form: algorithm, parameters, salt and hash in one value. */
export type PasswordHash = string & { readonly __brand: 'PasswordHash' };
export type AccountId = string & { readonly __brand: 'AccountId' };
/** An address in its normalized form (trimmed, lowercase), the only form accounts are looked up by. */
export type Email = string & { readonly __brand: 'Email' };

export const toEmail = (raw: string): Email => normalizeEmail(raw) as Email;

// Five wrong passwords in a row lock the account for a quarter of an hour: enough to stop guessing, short
// enough that a player who mistyped can try again after a break.
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MS = 15 * 60 * 1000;

export interface AccountState {
  readonly id: AccountId;
  readonly email: Email;
  readonly passwordHash: PasswordHash;
  readonly failedLogins: number;
  readonly lockedUntil: Date | null;
  /** When the player confirmed the address by the link in the e-mail; null until then. */
  readonly emailVerifiedAt: Date | null;
  readonly createdAt: Date;
}

export class Account {
  private constructor(private state: AccountState) {}

  static create(id: AccountId, email: Email, passwordHash: PasswordHash, now: Date): Account {
    return new Account({
      id,
      email,
      passwordHash,
      failedLogins: 0,
      lockedUntil: null,
      emailVerifiedAt: null,
      createdAt: now,
    });
  }

  static restore(state: AccountState): Account {
    return new Account(state);
  }

  get id(): AccountId {
    return this.state.id;
  }

  get email(): Email {
    return this.state.email;
  }

  get passwordHash(): PasswordHash {
    return this.state.passwordHash;
  }

  get emailVerified(): boolean {
    return this.state.emailVerifiedAt !== null;
  }

  snapshot(): AccountState {
    return this.state;
  }

  isLocked(now: Date): boolean {
    return this.state.lockedUntil !== null && now < this.state.lockedUntil;
  }

  /**
   * A wrong password counts towards a lock. The count resets when the lock is set, so once it runs out the
   * player gets the full number of tries again. Called only while the account is not locked.
   */
  recordFailedLogin(now: Date): void {
    const failedLogins = this.state.failedLogins + 1;
    this.state =
      failedLogins >= MAX_FAILED_LOGINS
        ? { ...this.state, failedLogins: 0, lockedUntil: new Date(now.getTime() + LOCK_MS) }
        : { ...this.state, failedLogins, lockedUntil: null };
  }

  recordSuccessfulLogin(): void {
    this.state = { ...this.state, failedLogins: 0, lockedUntil: null };
  }

  changePassword(passwordHash: PasswordHash): void {
    this.state = { ...this.state, passwordHash };
  }

  /** Confirming again keeps the first time. */
  confirmEmail(now: Date): void {
    if (this.state.emailVerifiedAt === null) this.state = { ...this.state, emailVerifiedAt: now };
  }
}
