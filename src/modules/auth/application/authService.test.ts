import { beforeEach, describe, expect, it } from 'vitest';
import { LOCK_MS } from '../domain/account';
import { SESSION_MS } from '../domain/session';
import { createInMemoryAuth, type InMemoryAuth } from '../testing/inMemoryAuth';
import { RESET_MS } from '../domain/oneTimeLink';
import {
  changePassword,
  confirmEmail,
  confirmEmailWithCode,
  currentAccount,
  login,
  logout,
  register,
  requestPasswordReset,
  resetPassword,
} from './authService';

let auth: InMemoryAuth;
beforeEach(() => {
  auth = createInMemoryAuth();
});

const PASSWORD = 'camino2026';
// The fake tokens are numbered: sign-up's confirmation link is token-1, and following it starts session token-2.
const LINK_TOKEN = 'token-1';
const registered = () => register(auth, 'ana@example.com', PASSWORD);
/** A player who signed up and followed the link: confirmed and signed in. */
const signedUp = async () => {
  await registered();
  return confirmEmail(auth, LINK_TOKEN);
};
const failedLogins = async (times: number) => {
  for (let i = 0; i < times; i++) await login(auth, 'ana@example.com', 'wrong-password').catch(() => {});
};

describe('register', () => {
  it('creates the account without signing in, so the address has to be confirmed first', async () => {
    await registered();

    await expect(login(auth, 'ana@example.com', PASSWORD)).rejects.toMatchObject({ code: 'email_not_verified' });
    expect(auth.sessionList()).toEqual([]);
  });

  it('stores the address normalized, so a differently written one is the same account', async () => {
    await register(auth, '  Ana@Example.com ', PASSWORD);

    await expect(register(auth, 'ana@example.com', PASSWORD)).rejects.toMatchObject({ code: 'email_taken' });
  });

  it('rejects a password shorter than eight characters', async () => {
    await expect(register(auth, 'ana@example.com', '1234567')).rejects.toMatchObject({ code: 'password_too_short' });
  });

  it('rejects a password longer than 128 characters', async () => {
    await expect(register(auth, 'ana@example.com', 'x'.repeat(129))).rejects.toMatchObject({
      code: 'password_too_long',
    });
  });

  it('rejects a password known from data breaches', async () => {
    auth.breachedList.add('password123');

    await expect(register(auth, 'ana@example.com', 'password123')).rejects.toMatchObject({ code: 'password_breached' });
  });

  it('rejects an invalid address', async () => {
    await expect(register(auth, 'ana', PASSWORD)).rejects.toMatchObject({ code: 'validation_failed' });
  });
});

describe('login', () => {
  it('signs in with the right password', async () => {
    await signedUp();

    const { token } = await login(auth, 'ANA@example.com', PASSWORD);

    expect(await currentAccount(auth, token)).toEqual({ email: 'ana@example.com' });
  });

  it('gives the same answer for a wrong password and an unknown address', async () => {
    await signedUp();

    await expect(login(auth, 'ana@example.com', 'wrong-password')).rejects.toMatchObject({
      code: 'invalid_credentials',
    });
    await expect(login(auth, 'nobody@example.com', PASSWORD)).rejects.toMatchObject({ code: 'invalid_credentials' });
  });

  it('locks the account on the fifth wrong password in a row', async () => {
    await signedUp();
    await failedLogins(4);

    await expect(login(auth, 'ana@example.com', 'wrong-password')).rejects.toMatchObject({ code: 'account_locked' });
  });

  it('refuses even the right password while the account is locked', async () => {
    await signedUp();
    await failedLogins(5);
    auth.clock.advance(LOCK_MS - 1);

    await expect(login(auth, 'ana@example.com', PASSWORD)).rejects.toMatchObject({ code: 'account_locked' });
  });

  it('refuses the right password while the address is unconfirmed', async () => {
    await registered();

    await expect(login(auth, 'ana@example.com', PASSWORD)).rejects.toMatchObject({ code: 'email_not_verified' });
  });

  it('gives an unconfirmed account the same answer as anyone for a wrong password', async () => {
    await registered();

    await expect(login(auth, 'ana@example.com', 'wrong-password')).rejects.toMatchObject({
      code: 'invalid_credentials',
    });
  });

  it('lets the right password in once the lock has run out', async () => {
    await signedUp();
    await failedLogins(5);
    auth.clock.advance(LOCK_MS);

    await expect(login(auth, 'ana@example.com', PASSWORD)).resolves.toMatchObject({
      account: { email: 'ana@example.com' },
    });
  });
});

describe('sessions', () => {
  it('treats a missing token as signed out', async () => {
    await expect(currentAccount(auth, null)).rejects.toMatchObject({ code: 'unauthenticated' });
  });

  it('treats an unknown token as signed out', async () => {
    await expect(currentAccount(auth, 'made-up')).rejects.toMatchObject({ code: 'unauthenticated' });
  });

  it('keeps a session until one moment before thirty days have passed', async () => {
    const { token } = await signedUp();
    auth.clock.advance(SESSION_MS - 1);

    await expect(currentAccount(auth, token)).resolves.toEqual({ email: 'ana@example.com' });
  });

  it('ends a session after thirty days and forgets it', async () => {
    const { token } = await signedUp();
    auth.clock.advance(SESSION_MS);

    await expect(currentAccount(auth, token)).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(auth.sessionList()).toEqual([]);
  });

  it('signs out only the session that asks', async () => {
    const phone = await signedUp();
    const laptop = await login(auth, 'ana@example.com', PASSWORD);

    await logout(auth, phone.token);

    await expect(currentAccount(auth, phone.token)).rejects.toMatchObject({ code: 'unauthenticated' });
    await expect(currentAccount(auth, laptop.token)).resolves.toEqual({
      email: 'ana@example.com',
    });
  });

  it('accepts signing out twice', async () => {
    const { token } = await signedUp();
    await logout(auth, token);

    await expect(logout(auth, token)).resolves.toBeUndefined();
  });
});

describe('changePassword', () => {
  it('changes the password so only the new one signs in', async () => {
    const { token } = await signedUp();

    await changePassword(auth, token, PASSWORD, 'santiago2026');

    await expect(login(auth, 'ana@example.com', PASSWORD)).rejects.toMatchObject({ code: 'invalid_credentials' });
    await expect(login(auth, 'ana@example.com', 'santiago2026')).resolves.toBeDefined();
  });

  it('signs out every other session and keeps the one that made the change', async () => {
    const phone = await signedUp();
    const laptop = await login(auth, 'ana@example.com', PASSWORD);

    await changePassword(auth, phone.token, PASSWORD, 'santiago2026');

    await expect(currentAccount(auth, phone.token)).resolves.toEqual({
      email: 'ana@example.com',
    });
    await expect(currentAccount(auth, laptop.token)).rejects.toMatchObject({ code: 'unauthenticated' });
  });

  it('requires a signed-in session', async () => {
    await signedUp();

    await expect(changePassword(auth, null, PASSWORD, 'santiago2026')).rejects.toMatchObject({
      code: 'unauthenticated',
    });
  });

  it('rejects a wrong current password', async () => {
    const { token } = await signedUp();

    await expect(changePassword(auth, token, 'wrong-password', 'santiago2026')).rejects.toMatchObject({
      code: 'wrong_password',
    });
  });

  it('locks the account on the fifth wrong current password in a row', async () => {
    const { token } = await signedUp();
    await failedLogins(4);

    await expect(changePassword(auth, token, 'wrong-password', 'santiago2026')).rejects.toMatchObject({
      code: 'account_locked',
    });
  });

  it('rejects a new password equal to the current one', async () => {
    const { token } = await signedUp();

    await expect(changePassword(auth, token, PASSWORD, PASSWORD)).rejects.toMatchObject({ code: 'password_unchanged' });
  });

  it('rejects a new password known from data breaches', async () => {
    const { token } = await signedUp();
    auth.breachedList.add('password123');

    await expect(changePassword(auth, token, PASSWORD, 'password123')).rejects.toMatchObject({
      code: 'password_breached',
    });
  });

  it('rejects a new password shorter than eight characters', async () => {
    const { token } = await signedUp();

    await expect(changePassword(auth, token, PASSWORD, '1234567')).rejects.toMatchObject({
      code: 'password_too_short',
    });
  });
});

describe('dev sign-in', () => {
  const devAuth = () => ({ ...auth, devPassword: 'localhost' });

  it('signs in to an existing account with the dev password', async () => {
    await signedUp();

    const { token } = await login(devAuth(), 'ana@example.com', 'localhost');

    expect(await currentAccount(auth, token)).toEqual({ email: 'ana@example.com' });
  });

  it('confirms an unconfirmed address, as there is no mailbox to confirm it from locally', async () => {
    await registered();

    await login(devAuth(), 'ana@example.com', 'localhost');

    await expect(login(auth, 'ana@example.com', PASSWORD)).resolves.toMatchObject({ account: expect.anything() });
  });

  it('creates the account when the address is new', async () => {
    const { token } = await login(devAuth(), 'ben@example.com', 'localhost');

    expect(await currentAccount(auth, token)).toEqual({ email: 'ben@example.com' });
  });

  it('does not reveal a known password for an account it created', async () => {
    await login(devAuth(), 'ben@example.com', 'localhost');

    await expect(login(auth, 'ben@example.com', 'localhost')).rejects.toMatchObject({ code: 'invalid_credentials' });
  });

  it('treats "localhost" as an ordinary wrong password when the dev sign-in is off', async () => {
    await signedUp();

    await expect(login(auth, 'ana@example.com', 'localhost')).rejects.toMatchObject({ code: 'invalid_credentials' });
  });
});

describe('resetting a forgotten password', () => {
  const NEW_PASSWORD = 'santiago2026';
  // Sign-up takes token-1 (confirmation link) and token-2 (session), so the reset link is token-3.
  const RESET_TOKEN = 'token-3';
  const resetMail = () => auth.outbox.find((mail) => mail.subject === 'Nowe hasło do Wayfarera');

  it('e-mails a link for a new password to an address with an account', async () => {
    await signedUp();

    await requestPasswordReset(auth, 'Ana@Example.com');

    expect(resetMail()).toEqual(
      expect.objectContaining({
        to: 'ana@example.com',
        text: expect.stringContaining(`https://wayfarer.example/reset-password?token=${RESET_TOKEN}`),
      }),
    );
  });

  it('answers the same for an address without an account, and sends nothing', async () => {
    await expect(requestPasswordReset(auth, 'nobody@example.com')).resolves.toBeUndefined();

    expect(auth.outbox).toEqual([]);
  });

  it('sets the new password, signs out every session and signs the player in afresh', async () => {
    const { token: oldSession } = await signedUp();
    await requestPasswordReset(auth, 'ana@example.com');

    const { token } = await resetPassword(auth, RESET_TOKEN, NEW_PASSWORD);

    await expect(currentAccount(auth, oldSession)).rejects.toMatchObject({ code: 'unauthenticated' });
    await expect(currentAccount(auth, token)).resolves.toMatchObject({ email: 'ana@example.com' });
    await expect(login(auth, 'ana@example.com', NEW_PASSWORD)).resolves.toMatchObject({ account: expect.anything() });
  });

  it('confirms the address, since the link came to that mailbox', async () => {
    await registered();
    await requestPasswordReset(auth, 'ana@example.com');
    await resetPassword(auth, 'token-2', NEW_PASSWORD);

    await expect(login(auth, 'ana@example.com', NEW_PASSWORD)).resolves.toMatchObject({ account: expect.anything() });
  });

  it('stops the confirmation link and code still waiting in the mailbox from signing in', async () => {
    await registered();
    await requestPasswordReset(auth, 'ana@example.com');
    await resetPassword(auth, 'token-2', NEW_PASSWORD);

    await expect(confirmEmail(auth, LINK_TOKEN)).rejects.toMatchObject({ code: 'verification_invalid' });
    await expect(confirmEmailWithCode(auth, 'ana@example.com', '100-001')).rejects.toMatchObject({
      code: 'verification_code_invalid',
    });
  });

  it('lifts a sign-in lock', async () => {
    await signedUp();
    await failedLogins(5);
    await requestPasswordReset(auth, 'ana@example.com');
    await resetPassword(auth, RESET_TOKEN, NEW_PASSWORD);

    await expect(login(auth, 'ana@example.com', NEW_PASSWORD)).resolves.toMatchObject({ account: expect.anything() });
  });

  it('refuses a link used once already', async () => {
    await signedUp();
    await requestPasswordReset(auth, 'ana@example.com');
    await resetPassword(auth, RESET_TOKEN, NEW_PASSWORD);

    await expect(resetPassword(auth, RESET_TOKEN, 'another2026')).rejects.toMatchObject({ code: 'reset_invalid' });
  });

  it('still takes the link a moment before 30 minutes have passed', async () => {
    await signedUp();
    await requestPasswordReset(auth, 'ana@example.com');
    auth.clock.advance(RESET_MS - 1);

    await expect(resetPassword(auth, RESET_TOKEN, NEW_PASSWORD)).resolves.toMatchObject({ token: expect.any(String) });
  });

  it('refuses the link once 30 minutes have passed', async () => {
    await signedUp();
    await requestPasswordReset(auth, 'ana@example.com');
    auth.clock.advance(RESET_MS);

    await expect(resetPassword(auth, RESET_TOKEN, NEW_PASSWORD)).rejects.toMatchObject({ code: 'reset_invalid' });
  });

  it('keeps only the newest link working', async () => {
    await signedUp();
    await requestPasswordReset(auth, 'ana@example.com');
    await requestPasswordReset(auth, 'ana@example.com');

    await expect(resetPassword(auth, RESET_TOKEN, NEW_PASSWORD)).rejects.toMatchObject({ code: 'reset_invalid' });
    await expect(resetPassword(auth, 'token-4', NEW_PASSWORD)).resolves.toMatchObject({ token: expect.any(String) });
  });

  it('holds the new password to the sign-up rules', async () => {
    await signedUp();
    await requestPasswordReset(auth, 'ana@example.com');

    await expect(resetPassword(auth, RESET_TOKEN, '1234567')).rejects.toMatchObject({ code: 'password_too_short' });
  });
});
