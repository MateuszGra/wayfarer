import type { AuthDependencies } from '../application/authService.js';
import { Account, type AccountId, type PasswordHash } from '../domain/account.js';
import type { EmailVerification } from '../domain/emailVerification.js';
import type { OneTimeLink } from '../domain/oneTimeLink.js';
import type {
  AccountRepository,
  Clock,
  EmailVerificationRepository,
  Mail,
  OneTimeLinkRepository,
  SessionRepository,
} from '../domain/ports.js';
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
  /** E-mails the fake mailer sent, oldest first. */
  readonly outbox: Mail[];
  /** Makes the fake mailer fail, as an unreachable mail server would. */
  readonly mailDown: { value: boolean };
}

/**
 * Auth dependencies without a database, network or real hashing: the fake hash is the password with a
 * prefix, tokens are numbered, and codes count up from 100001. For use-case and API tests.
 */
export function createInMemoryAuth(start = new Date('2026-11-20T10:00:00Z')): InMemoryAuth {
  const accounts = new Map<AccountId, Account>();
  const sessions = new Map<SessionTokenHash, Session>();
  const breachedList = new Set<string>();
  const outbox: Mail[] = [];
  const mailDown = { value: false };
  let nextId = 1,
    nextToken = 1,
    nextCode = 100_001;

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

  const linkRepo = (): OneTimeLinkRepository => {
    const links = new Map<SessionTokenHash, OneTimeLink>();
    return {
      async add(link) {
        links.set(link.tokenHash, link);
      },
      async find(tokenHash) {
        return links.get(tokenHash) ?? null;
      },
      async removeAllFor(accountId) {
        for (const [hash, link] of links) if (link.accountId === accountId) links.delete(hash);
      },
    };
  };

  const verifications = new Map<SessionTokenHash, { verification: EmailVerification; attempts: number }>();
  const verificationRepo: EmailVerificationRepository = {
    async add(verification) {
      verifications.set(verification.tokenHash, { verification, attempts: 0 });
    },
    async find(tokenHash) {
      return verifications.get(tokenHash)?.verification ?? null;
    },
    async findFor(accountId) {
      return [...verifications.values()].find((v) => v.verification.accountId === accountId)?.verification ?? null;
    },
    async countCodeAttempt(tokenHash, max) {
      const entry = verifications.get(tokenHash);
      if (!entry || entry.attempts >= max) return false;
      entry.attempts++;
      return true;
    },
    async removeAllFor(accountId) {
      for (const [hash, v] of verifications) if (v.verification.accountId === accountId) verifications.delete(hash);
    },
  };

  return {
    accounts: accountRepo,
    sessions: sessionRepo,
    verifications: verificationRepo,
    codes: { issue: () => String(nextCode++) },
    passwordResets: linkRepo(),
    mailer: {
      async send(mail) {
        if (mailDown.value) throw new Error('mail server unreachable');
        outbox.push(mail);
      },
    },
    appUrl: 'https://wayfarer.example',
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
    outbox,
    mailDown,
  };
}
