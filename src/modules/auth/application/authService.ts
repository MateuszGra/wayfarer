import type { AccountDto } from '../../../shared/api/contracts.js';
import { emailError } from '../../../shared/auth/email.js';
import { existingPasswordError, newPasswordError } from '../../../shared/auth/password.js';
import { Account, toEmail } from '../domain/account.js';
import { AuthError } from '../domain/errors.js';
import type {
  AccountRepository,
  BreachedPasswords,
  Clock,
  IdGenerator,
  PasswordHasher,
  SessionRepository,
  SessionTokens,
} from '../domain/ports.js';
import { isSessionActive, startSession, type SessionTokenHash } from '../domain/session.js';

export interface AuthDependencies {
  readonly accounts: AccountRepository;
  readonly sessions: SessionRepository;
  readonly hasher: PasswordHasher;
  readonly breached: BreachedPasswords;
  readonly tokens: SessionTokens;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  /**
   * Local development only: this password signs in with any address, creating the account if needed.
   * Left out everywhere else; the server refuses to start with it in a production-like configuration.
   */
  readonly devPassword?: string | undefined;
}

/** A signed-in result: the token to hand to the player and the account it belongs to. */
export interface SignedIn {
  readonly token: string;
  readonly account: AccountDto;
}

export interface Authenticated {
  readonly account: Account;
  readonly tokenHash: SessionTokenHash;
}

const toDto = (account: Account): AccountDto => ({ email: account.email });

const NEW_PASSWORD_CODES = { passwordTooShort: 'password_too_short', passwordTooLong: 'password_too_long' } as const;

async function checkNewPassword(deps: AuthDependencies, password: string): Promise<void> {
  const error = newPasswordError(password);
  if (error === 'passwordRequired') throw new AuthError('validation_failed');
  if (error === 'passwordTooShort' || error === 'passwordTooLong') throw new AuthError(NEW_PASSWORD_CODES[error]);
  if (await deps.breached.isBreached(password)) throw new AuthError('password_breached');
}

async function signIn(deps: AuthDependencies, account: Account): Promise<SignedIn> {
  const { token, hash } = deps.tokens.issue();
  await deps.sessions.add(startSession(hash, account.id, deps.clock.now()));
  return { token, account: toDto(account) };
}

export async function register(deps: AuthDependencies, email: string, password: string): Promise<SignedIn> {
  if (emailError(email)) throw new AuthError('validation_failed');
  await checkNewPassword(deps, password);
  const account = Account.create(
    deps.ids.accountId(),
    toEmail(email),
    await deps.hasher.hash(password),
    deps.clock.now(),
  );
  if (!(await deps.accounts.add(account))) throw new AuthError('email_taken');
  return signIn(deps, account);
}

/** One answer for an unknown address and a wrong password, so sign-in can't be used to find accounts. */
export async function login(deps: AuthDependencies, email: string, password: string): Promise<SignedIn> {
  if (emailError(email) || existingPasswordError(password)) throw new AuthError('validation_failed');
  if (deps.devPassword !== undefined && password === deps.devPassword) return devLogin(deps, email);
  const account = await deps.accounts.findByEmail(toEmail(email));
  const now = deps.clock.now();
  if (account?.isLocked(now)) throw new AuthError('account_locked');
  const valid = await deps.hasher.verify(password, account?.passwordHash ?? null);
  if (!account || !valid) {
    if (account) {
      account.recordFailedLogin(now);
      await deps.accounts.save(account);
      if (account.isLocked(now)) throw new AuthError('account_locked');
    }
    throw new AuthError('invalid_credentials');
  }
  account.recordSuccessfulLogin();
  await deps.accounts.save(account);
  return signIn(deps, account);
}

async function devLogin(deps: AuthDependencies, email: string): Promise<SignedIn> {
  const existing = await deps.accounts.findByEmail(toEmail(email));
  if (existing) return signIn(deps, existing);
  // A random password nobody knows; the account is reached through the dev password only.
  const unknown = await deps.hasher.hash(deps.tokens.issue().token);
  const account = Account.create(deps.ids.accountId(), toEmail(email), unknown, deps.clock.now());
  await deps.accounts.add(account);
  return signIn(deps, account);
}

export async function authenticate(deps: AuthDependencies, token: string | null): Promise<Authenticated> {
  if (!token) throw new AuthError('unauthenticated');
  const tokenHash = deps.tokens.hashOf(token);
  const session = await deps.sessions.find(tokenHash);
  if (!session) throw new AuthError('unauthenticated');
  if (!isSessionActive(session, deps.clock.now())) {
    await deps.sessions.remove(tokenHash);
    throw new AuthError('unauthenticated');
  }
  const account = await deps.accounts.findById(session.accountId);
  if (!account) throw new AuthError('unauthenticated');
  return { account, tokenHash };
}

export async function currentAccount(deps: AuthDependencies, token: string | null): Promise<AccountDto> {
  return toDto((await authenticate(deps, token)).account);
}

/** Signing out of a session that is already gone is not an error: the end state is the same. */
export async function logout(deps: AuthDependencies, token: string | null): Promise<void> {
  if (token) await deps.sessions.remove(deps.tokens.hashOf(token));
}

/**
 * Needs the current password even inside a session, so a borrowed, still signed-in phone can't take the
 * account over. A wrong current password counts towards the lock like a wrong sign-in. Afterwards every
 * other session is signed out; the one that made the change stays.
 */
export async function changePassword(
  deps: AuthDependencies,
  token: string | null,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const { account, tokenHash } = await authenticate(deps, token);
  const now = deps.clock.now();
  if (account.isLocked(now)) throw new AuthError('account_locked');
  if (!(await deps.hasher.verify(currentPassword, account.passwordHash))) {
    account.recordFailedLogin(now);
    await deps.accounts.save(account);
    throw new AuthError(account.isLocked(now) ? 'account_locked' : 'wrong_password');
  }
  if (newPassword === currentPassword) throw new AuthError('password_unchanged');
  await checkNewPassword(deps, newPassword);
  account.changePassword(await deps.hasher.hash(newPassword));
  account.recordSuccessfulLogin();
  await deps.accounts.save(account);
  await deps.sessions.removeAllFor(account.id, tokenHash);
}
