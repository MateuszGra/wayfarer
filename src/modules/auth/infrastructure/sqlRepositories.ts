import type { Kysely, Selectable } from 'kysely';
import type { AccountsTable, Database } from '../../../db/schema.js';
import { Account, type AccountId, type Email, type PasswordHash } from '../domain/account.js';
import type { AccountRepository, SessionRepository } from '../domain/ports.js';
import type { SessionTokenHash } from '../domain/session.js';

const toAccount = (row: Selectable<AccountsTable>): Account =>
  Account.restore({
    id: row.id as AccountId,
    email: row.email as Email,
    passwordHash: row.password_hash as PasswordHash,
    failedLogins: row.failed_logins,
    lockedUntil: row.locked_until,
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
        .set({ password_hash: s.passwordHash, failed_logins: s.failedLogins, locked_until: s.lockedUntil })
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
