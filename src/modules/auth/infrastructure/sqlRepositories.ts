import type { Kysely, Selectable } from 'kysely';
import type { AccountsTable, Database } from '../../../db/schema.js';
import { Account, type AccountId, type Email, type PasswordHash } from '../domain/account.js';
import type { CodeHash, EmailVerification } from '../domain/emailVerification.js';
import type {
  AccountRepository,
  EmailVerificationRepository,
  OneTimeLinkRepository,
  SessionRepository,
} from '../domain/ports.js';
import type { SessionTokenHash } from '../domain/session.js';

const toAccount = (row: Selectable<AccountsTable>): Account =>
  Account.restore({
    id: row.id as AccountId,
    email: row.email as Email,
    passwordHash: row.password_hash as PasswordHash,
    failedLogins: row.failed_logins,
    lockedUntil: row.locked_until,
    emailVerifiedAt: row.email_verified_at,
    createdAt: row.created_at,
  });

export function createSqlAccountRepository(db: Kysely<Database>): AccountRepository {
  return {
    async findByEmail(email: Email) {
      const row = await db.selectFrom('accounts').selectAll().where('email', '=', email).executeTakeFirst();
      return row ? toAccount(row) : null;
    },
    async findById(id: AccountId) {
      const row = await db.selectFrom('accounts').selectAll().where('id', '=', id).executeTakeFirst();
      return row ? toAccount(row) : null;
    },
    async add(account) {
      const s = account.snapshot();
      const inserted = await db
        .insertInto('accounts')
        .values({ id: s.id, email: s.email, password_hash: s.passwordHash, created_at: s.createdAt })
        .onConflict((oc) => oc.column('email').doNothing())
        .returning('id')
        .executeTakeFirst();
      return inserted !== undefined;
    },
    async save(account) {
      const s = account.snapshot();
      await db
        .updateTable('accounts')
        .set({
          password_hash: s.passwordHash,
          failed_logins: s.failedLogins,
          locked_until: s.lockedUntil,
          email_verified_at: s.emailVerifiedAt,
        })
        .where('id', '=', s.id)
        .execute();
    },
  };
}

export function createSqlSessionRepository(db: Kysely<Database>): SessionRepository {
  return {
    async add(session) {
      await db
        .insertInto('sessions')
        .values({ token_hash: session.tokenHash, account_id: session.accountId, expires_at: session.expiresAt })
        .execute();
    },
    async find(tokenHash: SessionTokenHash) {
      const row = await db.selectFrom('sessions').selectAll().where('token_hash', '=', tokenHash).executeTakeFirst();
      return row
        ? {
            tokenHash: row.token_hash as SessionTokenHash,
            accountId: row.account_id as AccountId,
            expiresAt: row.expires_at,
          }
        : null;
    },
    async remove(tokenHash: SessionTokenHash) {
      await db.deleteFrom('sessions').where('token_hash', '=', tokenHash).execute();
    },
    async removeAllFor(accountId: AccountId, except?: SessionTokenHash) {
      let query = db.deleteFrom('sessions').where('account_id', '=', accountId);
      if (except) query = query.where('token_hash', '!=', except);
      await query.execute();
    },
  };
}

/** Password links. */
export function createSqlOneTimeLinkRepository(db: Kysely<Database>, table: 'password_resets'): OneTimeLinkRepository {
  return {
    async add(link) {
      await db
        .insertInto(table)
        .values({ token_hash: link.tokenHash, account_id: link.accountId, expires_at: link.expiresAt })
        .execute();
    },
    async find(tokenHash: SessionTokenHash) {
      const row = await db
        .selectFrom(table)
        .select(['token_hash', 'account_id', 'expires_at'])
        .where('token_hash', '=', tokenHash)
        .executeTakeFirst();
      return row
        ? {
            tokenHash: row.token_hash as SessionTokenHash,
            accountId: row.account_id as AccountId,
            expiresAt: row.expires_at,
          }
        : null;
    },
    async removeAllFor(accountId: AccountId) {
      await db.deleteFrom(table).where('account_id', '=', accountId).execute();
    },
  };
}

const VERIFICATION_COLUMNS = ['token_hash', 'account_id', 'expires_at', 'code_hash'] as const;
const toVerification = (row: {
  token_hash: string;
  account_id: string;
  expires_at: Date;
  code_hash: string;
}): EmailVerification => ({
  tokenHash: row.token_hash as SessionTokenHash,
  accountId: row.account_id as AccountId,
  expiresAt: row.expires_at,
  codeHash: row.code_hash as CodeHash,
});

export function createSqlEmailVerificationRepository(db: Kysely<Database>): EmailVerificationRepository {
  return {
    async add(verification) {
      await db
        .insertInto('email_verifications')
        .values({
          token_hash: verification.tokenHash,
          account_id: verification.accountId,
          expires_at: verification.expiresAt,
          code_hash: verification.codeHash,
        })
        .execute();
    },
    async find(tokenHash) {
      const row = await db
        .selectFrom('email_verifications')
        .select(VERIFICATION_COLUMNS)
        .where('token_hash', '=', tokenHash)
        .executeTakeFirst();
      return row ? toVerification(row) : null;
    },
    async findFor(accountId) {
      const row = await db
        .selectFrom('email_verifications')
        .select(VERIFICATION_COLUMNS)
        .where('account_id', '=', accountId)
        .orderBy('created_at', 'desc')
        .executeTakeFirst();
      return row ? toVerification(row) : null;
    },
    async countCodeAttempt(tokenHash, max) {
      // One statement: the row is locked while it is counted, so parallel tries queue up behind each other.
      const counted = await db
        .updateTable('email_verifications')
        .set((eb) => ({ code_attempts: eb('code_attempts', '+', 1) }))
        .where('token_hash', '=', tokenHash)
        .where('code_attempts', '<', max)
        .executeTakeFirst();
      return counted.numUpdatedRows > 0n;
    },
    async removeAllFor(accountId) {
      await db.deleteFrom('email_verifications').where('account_id', '=', accountId).execute();
    },
  };
}
