import type { AuthDependencies } from '../application/authService.js';
import { Account, type AccountId, type PasswordHash } from '../domain/account.js';
import type { AccountRepository, Clock, SessionRepository } from '../domain/ports.js';
import type { Session, SessionTokenHash } from '../domain/session.js';

/** A clock tests move by hand. */
export class FakeClock implements Clock {
  constructor(private current: Date) {}
  now(): Date {
    return this.current;
  }
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

export interface InMemoryAuth extends AuthDependencies {
  readonly clock: FakeClock;
  /** Passwords the fake breach check reports as leaked. */
  readonly breachedList: Set<string>;
  readonly sessionList: () => readonly Session[];
}

/**
 * Auth dependencies without a database, network or real hashing: the fake hash is the password with a
 * prefix, and tokens are numbered. For use-case and API tests.
 */
export function createInMemoryAuth(start = new Date('2026-11-20T10:00:00Z')): InMemoryAuth {
  const accounts = new Map<AccountId, Account>();
  const sessions = new Map<SessionTokenHash, Session>();
  const breachedList = new Set<string>();
  let nextId = 1,
    nextToken = 1;

  const accountRepo: AccountRepository = {
    async findByEmail(email) {
      return [...accounts.values()].find((a) => a.email === email) ?? null;
    },
    async findById(id) {
      return accounts.get(id) ?? null;
    },
    async add(account) {
      if ([...accounts.values()].some((a) => a.email === account.email)) return false;
      accounts.set(account.id, Account.restore(account.snapshot()));
      return true;
    },
    async save(account) {
      accounts.set(account.id, Account.restore(account.snapshot()));
    },
  };
  const sessionRepo: SessionRepository = {
    async add(session) {
      sessions.set(session.tokenHash, session);
    },
    async find(tokenHash) {
      return sessions.get(tokenHash) ?? null;
    },
    async remove(tokenHash) {
      sessions.delete(tokenHash);
    },
    async removeAllFor(accountId, except) {
      for (const [hash, s] of sessions) if (s.accountId === accountId && hash !== except) sessions.delete(hash);
    },
  };

  return {
    accounts: accountRepo,
    sessions: sessionRepo,
    hasher: {
      hash: async (password) => `hashed:${password}` as PasswordHash,
      verify: async (password, hash) => hash === `hashed:${password}`,
    },
    breached: { isBreached: async (password) => breachedList.has(password) },
    tokens: {
      issue: () => {
        const token = `token-${nextToken++}`;
        return { token, hash: `hash:${token}` as SessionTokenHash };
      },
      hashOf: (token) => `hash:${token}` as SessionTokenHash,
    },
    clock: new FakeClock(start),
    ids: { accountId: () => `account-${nextId++}` as AccountId },
    breachedList,
    sessionList: () => [...sessions.values()],
  };
}
