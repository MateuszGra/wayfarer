import type { AccountDto } from '../../../shared/api/contracts.js';
import { emailError } from '../../../shared/auth/email.js';
import { existingPasswordError, newPasswordError } from '../../../shared/auth/password.js';
import { formatVerificationCode, normalizeVerificationCode } from '../../../shared/auth/verificationCode.js';
import { Account, toEmail } from '../domain/account.js';
import { MAX_CODE_ATTEMPTS, startVerification, type CodeHash } from '../domain/emailVerification.js';
import { isLinkActive, RESET_MS, startLink } from '../domain/oneTimeLink.js';
import { AuthError } from '../domain/errors.js';
import type {
  AccountRepository,
  BreachedPasswords,
  Clock,
  EmailVerificationRepository,
  IdGenerator,
  Mail,
  Mailer,
  OneTimeLinkRepository,
  PasswordHasher,
  SessionRepository,
  SessionTokens,
  VerificationCodes,
} from '../domain/ports.js';
import { isSessionActive, startSession, type SessionTokenHash } from '../domain/session.js';

export interface AuthDependencies {
  readonly accounts: AccountRepository;
  readonly sessions: SessionRepository;
  readonly verifications: EmailVerificationRepository;
  readonly codes: VerificationCodes;
  readonly passwordResets: OneTimeLinkRepository;
  readonly mailer: Mailer;
  /** The game's address, for the link in the confirmation e-mail. */
  readonly appUrl: string;
  /** Told when an e-mail could not be sent; the player can ask for it again. */
  readonly onMailError?: (error: unknown) => void;
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

/** The confirmation e-mail, in Polish like the rest of the game: a link, and a code for another device. */
export function verificationMail(to: string, appUrl: string, token: string, code: string): Mail {
  const link = `${appUrl.replace(/\/+$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
  return {
    to,
    subject: 'Potwierdź adres e-mail w Wayfarerze',
    text: `Cześć!\n\nKliknij, żeby potwierdzić, że ten adres należy do Ciebie:\n${link}\n\nAlbo wpisz w grze kod: ${formatVerificationCode(code)}\n\nLink i kod działają przez 48 godzin. Jeśli konto w Wayfarerze założył ktoś inny, po prostu zignoruj tę wiadomość.\n`,
  };
}

/**
 * The code's hash is salted with its link's, so one table of the million possible codes can't read every
 * stored code at once.
 */
const codeHashOf = (deps: AuthDependencies, linkHash: SessionTokenHash, code: string): CodeHash =>
  deps.tokens.hashOf(`${linkHash}:${code}`) as string as CodeHash;

/**
 * A new confirmation e-mail replaces any earlier one, link and code. A failed e-mail doesn't fail the
 * sign-up: the player can ask for it again from the sign-in screen.
 */
async function sendVerification(deps: AuthDependencies, account: Account): Promise<void> {
  const { token, hash } = deps.tokens.issue();
  const code = deps.codes.issue();
  await deps.verifications.removeAllFor(account.id);
  await deps.verifications.add(startVerification(hash, codeHashOf(deps, hash, code), account.id, deps.clock.now()));
  await sendQuietly(deps, verificationMail(account.email, deps.appUrl, token, code));
}

async function sendQuietly(deps: AuthDependencies, mail: Mail): Promise<void> {
  try {
    await deps.mailer.send(mail);
  } catch (error) {
    deps.onMailError?.(error);
  }
}

/** The e-mail with a link for setting a new password. */
export function passwordResetMail(to: string, appUrl: string, token: string): Mail {
  const link = `${appUrl.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
  return {
    to,
    subject: 'Nowe hasło do Wayfarera',
    text: `Cześć!\n\nKtoś, miejmy nadzieję, że Ty, poprosił o nowe hasło do konta w Wayfarerze. Ustawisz je tutaj:\n${link}\n\nLink działa przez 30 minut i tylko raz. Jeśli to nie Ty, zignoruj tę wiadomość: hasło się nie zmieni.\n`,
  };
}

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

/** Creates the account and e-mails a confirmation link; the player signs in by following it. */
export async function register(deps: AuthDependencies, email: string, password: string): Promise<void> {
  if (emailError(email)) throw new AuthError('validation_failed');
  await checkNewPassword(deps, password);
  const account = Account.create(
    deps.ids.accountId(),
    toEmail(email),
    await deps.hasher.hash(password),
    deps.clock.now(),
  );
  if (!(await deps.accounts.add(account))) throw new AuthError('email_taken');
  await sendVerification(deps, account);
}

/**
 * Confirms the address from the link's token and signs the player in: the link proves the mailbox is
 * theirs, and it is often opened on another device than the one used to sign up.
 */
export async function confirmEmail(deps: AuthDependencies, token: string): Promise<SignedIn> {
  const verification = await deps.verifications.find(deps.tokens.hashOf(token));
  const now = deps.clock.now();
  if (!verification || !isLinkActive(verification, now)) throw new AuthError('verification_invalid');
  const account = await deps.accounts.findById(verification.accountId);
  if (!account) throw new AuthError('verification_invalid');
  return finishConfirmation(deps, account, now);
}

/**
 * Confirms the address with the code from the e-mail, typed in on the device that plays, and signs the
 * player in. A wrong code, an unknown address, an expired e-mail and a code tried too often get one answer.
 */
export async function confirmEmailWithCode(deps: AuthDependencies, email: string, typed: string): Promise<SignedIn> {
  const code = normalizeVerificationCode(typed);
  if (emailError(email) || !code) throw new AuthError('validation_failed');
  const account = await deps.accounts.findByEmail(toEmail(email));
  const verification = account ? await deps.verifications.findFor(account.id) : null;
  const now = deps.clock.now();
  if (!account || !verification || !isLinkActive(verification, now)) throw new AuthError('verification_code_invalid');
  if (!(await deps.verifications.countCodeAttempt(verification.tokenHash, MAX_CODE_ATTEMPTS)))
    throw new AuthError('verification_code_invalid');
  if (codeHashOf(deps, verification.tokenHash, code) !== verification.codeHash)
    throw new AuthError('verification_code_invalid');
  return finishConfirmation(deps, account, now);
}

async function finishConfirmation(deps: AuthDependencies, account: Account, now: Date): Promise<SignedIn> {
  account.confirmEmail(now);
  await deps.accounts.save(account);
  await deps.verifications.removeAllFor(account.id);
  return signIn(deps, account);
}

/**
 * Sends a fresh confirmation link when the address has an unconfirmed account. The answer is the same
 * either way, so it can't be used to find out who plays.
 */
export async function resendVerification(deps: AuthDependencies, email: string): Promise<void> {
  if (emailError(email)) throw new AuthError('validation_failed');
  const account = await deps.accounts.findByEmail(toEmail(email));
  if (account && !account.emailVerified) await sendVerification(deps, account);
}

/**
 * One answer for an unknown address and a wrong password, so sign-in can't be used to find accounts. An
 * unconfirmed address is told apart only after the right password.
 */
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
  if (!account.emailVerified) throw new AuthError('email_not_verified');
  return signIn(deps, account);
}

/** Local development has no mailbox to confirm from, so the dev password confirms the address too. */
async function devLogin(deps: AuthDependencies, email: string): Promise<SignedIn> {
  const now = deps.clock.now();
  const existing = await deps.accounts.findByEmail(toEmail(email));
  if (existing) {
    existing.confirmEmail(now);
    await deps.accounts.save(existing);
    return signIn(deps, existing);
  }
  // A random password nobody knows; the account is reached through the dev password only.
  const unknown = await deps.hasher.hash(deps.tokens.issue().token);
  const account = Account.create(deps.ids.accountId(), toEmail(email), unknown, now);
  account.confirmEmail(now);
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

/**
 * Sends a link for a new password when the address has an account. The answer is the same either way, so
 * the form can't be used to find out who plays.
 */
export async function requestPasswordReset(deps: AuthDependencies, email: string): Promise<void> {
  if (emailError(email)) throw new AuthError('validation_failed');
  const account = await deps.accounts.findByEmail(toEmail(email));
  if (!account) return;
  const { token, hash } = deps.tokens.issue();
  await deps.passwordResets.removeAllFor(account.id);
  await deps.passwordResets.add(startLink(hash, account.id, deps.clock.now(), RESET_MS));
  await sendQuietly(deps, passwordResetMail(account.email, deps.appUrl, token));
}

/**
 * Sets a new password from the link's token. The link proves the mailbox is the player's, so it also
 * confirms the address and lifts a sign-in lock; every session is signed out and a new one starts here.
 */
export async function resetPassword(deps: AuthDependencies, token: string, newPassword: string): Promise<SignedIn> {
  const link = await deps.passwordResets.find(deps.tokens.hashOf(token));
  const now = deps.clock.now();
  if (!link || !isLinkActive(link, now)) throw new AuthError('reset_invalid');
  const account = await deps.accounts.findById(link.accountId);
  if (!account) throw new AuthError('reset_invalid');
  await checkNewPassword(deps, newPassword);
  account.changePassword(await deps.hasher.hash(newPassword));
  account.recordSuccessfulLogin();
  account.confirmEmail(now);
  await deps.accounts.save(account);
  await deps.passwordResets.removeAllFor(account.id);
  // The address is confirmed now, so a confirmation link or code still in the mailbox must not sign in later.
  await deps.verifications.removeAllFor(account.id);
  await deps.sessions.removeAllFor(account.id);
  return signIn(deps, account);
}
