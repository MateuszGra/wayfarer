import { describe, expect, it } from 'vitest';
import { Account, LOCK_MS, type AccountId, type PasswordHash, toEmail } from './account';

const NOW = new Date('2026-11-20T10:00:00Z');
const at = (ms: number) => new Date(NOW.getTime() + ms);
const account = () => Account.create('a1' as AccountId, toEmail('ana@example.com'), 'h' as PasswordHash, NOW);
// Arrange helper: that many wrong passwords in a row at one moment.
const failTimes = (a: Account, times: number, when = NOW) => {
  for (let i = 0; i < times; i++) a.recordFailedLogin(when);
};

describe('Account', () => {
  it('stays open after four wrong passwords in a row', () => {
    const a = account();

    failTimes(a, 4);

    expect(a.isLocked(NOW)).toBe(false);
  });

  it('locks for fifteen minutes on the fifth wrong password in a row', () => {
    const a = account();

    failTimes(a, 5);

    expect(a.isLocked(NOW)).toBe(true);
    expect(a.isLocked(at(LOCK_MS - 1))).toBe(true);
  });

  it('opens again exactly when the lock runs out', () => {
    const a = account();
    failTimes(a, 5);

    expect(a.isLocked(at(LOCK_MS))).toBe(false);
  });

  it('gives the full five tries again after a lock has run out', () => {
    const a = account();
    failTimes(a, 5);

    failTimes(a, 4, at(LOCK_MS));

    expect(a.isLocked(at(LOCK_MS))).toBe(false);
  });

  it('forgets earlier wrong passwords after a successful sign-in', () => {
    const a = account();
    failTimes(a, 4);

    a.recordSuccessfulLogin();
    a.recordFailedLogin(NOW);

    expect(a.isLocked(NOW)).toBe(false);
  });

  it('stores the address in its normalized form', () => {
    expect(Account.create('a1' as AccountId, toEmail('  Ana@Example.COM '), 'h' as PasswordHash, NOW).email).toBe(
      'ana@example.com',
    );
  });
});
