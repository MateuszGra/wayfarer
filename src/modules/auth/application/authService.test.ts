import { beforeEach, describe, expect, it } from 'vitest';
import { LOCK_MS } from '../domain/account';
import { SESSION_MS } from '../domain/session';
import { createInMemoryAuth, type InMemoryAuth } from '../testing/inMemoryAuth';
import { changePassword, currentAccount, login, logout, register } from './authService';

let auth: InMemoryAuth;
beforeEach(() => {
  auth = createInMemoryAuth();
});

const PASSWORD = 'camino2026';
const registered = () => register(auth, 'ana@example.com', PASSWORD);
const failedLogins = async (times: number) => {
  for (let i = 0; i < times; i++) await login(auth, 'ana@example.com', 'wrong-password').catch(() => {});
};

describe('register', () => {
  it('creates the account and signs the player in', async () => {
    const { token, account } = await registered();

    expect(account).toEqual({ email: 'ana@example.com' });
    expect(await currentAccount(auth, token)).toEqual({ email: 'ana@example.com' });
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
    await registered();

    const { token } = await login(auth, 'ANA@example.com', PASSWORD);

    expect(await currentAccount(auth, token)).toEqual({ email: 'ana@example.com' });
  });

  it('gives the same answer for a wrong password and an unknown address', async () => {
    await registered();

    await expect(login(auth, 'ana@example.com', 'wrong-password')).rejects.toMatchObject({
      code: 'invalid_credentials',
    });
    await expect(login(auth, 'nobody@example.com', PASSWORD)).rejects.toMatchObject({ code: 'invalid_credentials' });
  });

  it('locks the account on the fifth wrong password in a row', async () => {
    await registered();
    await failedLogins(4);

    await expect(login(auth, 'ana@example.com', 'wrong-password')).rejects.toMatchObject({ code: 'account_locked' });
  });

  it('refuses even the right password while the account is locked', async () => {
    await registered();
    await failedLogins(5);
    auth.clock.advance(LOCK_MS - 1);

    await expect(login(auth, 'ana@example.com', PASSWORD)).rejects.toMatchObject({ code: 'account_locked' });
  });

  it('lets the right password in once the lock has run out', async () => {
    await registered();
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
    const { token } = await registered();
    auth.clock.advance(SESSION_MS - 1);

    await expect(currentAccount(auth, token)).resolves.toEqual({ email: 'ana@example.com' });
  });

  it('ends a session after thirty days and forgets it', async () => {
    const { token } = await registered();
    auth.clock.advance(SESSION_MS);

    await expect(currentAccount(auth, token)).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(auth.sessionList()).toEqual([]);
  });

  it('signs out only the session that asks', async () => {
    const phone = await registered();
    const laptop = await login(auth, 'ana@example.com', PASSWORD);

    await logout(auth, phone.token);

    await expect(currentAccount(auth, phone.token)).rejects.toMatchObject({ code: 'unauthenticated' });
    await expect(currentAccount(auth, laptop.token)).resolves.toEqual({ email: 'ana@example.com' });
  });

  it('accepts signing out twice', async () => {
    const { token } = await registered();
    await logout(auth, token);

    await expect(logout(auth, token)).resolves.toBeUndefined();
  });
});

describe('changePassword', () => {
  it('changes the password so only the new one signs in', async () => {
    const { token } = await registered();

    await changePassword(auth, token, PASSWORD, 'santiago2026');

    await expect(login(auth, 'ana@example.com', PASSWORD)).rejects.toMatchObject({ code: 'invalid_credentials' });
    await expect(login(auth, 'ana@example.com', 'santiago2026')).resolves.toBeDefined();
  });

  it('signs out every other session and keeps the one that made the change', async () => {
    const phone = await registered();
    const laptop = await login(auth, 'ana@example.com', PASSWORD);

    await changePassword(auth, phone.token, PASSWORD, 'santiago2026');

    await expect(currentAccount(auth, phone.token)).resolves.toEqual({ email: 'ana@example.com' });
    await expect(currentAccount(auth, laptop.token)).rejects.toMatchObject({ code: 'unauthenticated' });
  });

  it('requires a signed-in session', async () => {
    await registered();

    await expect(changePassword(auth, null, PASSWORD, 'santiago2026')).rejects.toMatchObject({
      code: 'unauthenticated',
    });
  });

  it('rejects a wrong current password', async () => {
    const { token } = await registered();

    await expect(changePassword(auth, token, 'wrong-password', 'santiago2026')).rejects.toMatchObject({
      code: 'wrong_password',
    });
  });

  it('locks the account on the fifth wrong current password in a row', async () => {
    const { token } = await registered();
    await failedLogins(4);

    await expect(changePassword(auth, token, 'wrong-password', 'santiago2026')).rejects.toMatchObject({
      code: 'account_locked',
    });
  });

  it('rejects a new password equal to the current one', async () => {
    const { token } = await registered();

    await expect(changePassword(auth, token, PASSWORD, PASSWORD)).rejects.toMatchObject({ code: 'password_unchanged' });
  });

  it('rejects a new password known from data breaches', async () => {
    const { token } = await registered();
    auth.breachedList.add('password123');

    await expect(changePassword(auth, token, PASSWORD, 'password123')).rejects.toMatchObject({
      code: 'password_breached',
    });
  });

  it('rejects a new password shorter than eight characters', async () => {
    const { token } = await registered();

    await expect(changePassword(auth, token, PASSWORD, '1234567')).rejects.toMatchObject({
      code: 'password_too_short',
    });
  });
});

describe('dev sign-in', () => {
  const devAuth = () => ({ ...auth, devPassword: 'localhost' });

  it('signs in to an existing account with the dev password', async () => {
    await registered();

    const { token } = await login(devAuth(), 'ana@example.com', 'localhost');

    expect(await currentAccount(auth, token)).toEqual({ email: 'ana@example.com' });
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
    await registered();

    await expect(login(auth, 'ana@example.com', 'localhost')).rejects.toMatchObject({ code: 'invalid_credentials' });
  });
});
