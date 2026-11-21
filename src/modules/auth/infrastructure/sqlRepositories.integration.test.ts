import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Kysely } from 'kysely';
import { FileMigrationProvider, Migrator } from 'kysely/migration';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../../db/database';
import type { Database } from '../../../db/schema';
import { Account, type AccountId, type PasswordHash, toEmail } from '../domain/account';
import { startVerification, type CodeHash } from '../domain/emailVerification';
import { startSession, type SessionTokenHash } from '../domain/session';
import {
  createSqlAccountRepository,
  createSqlEmailVerificationRepository,
  createSqlSessionRepository,
} from './sqlRepositories';

// Runs against the separate wayfarer_test database (see docker/postgres/init.sql); skipped without it.
const url = process.env['TEST_DATABASE_URL'];
const NOW = new Date('2026-11-20T10:00:00Z');
const ID_A = '019aa0a0-0000-7000-8000-000000000001' as AccountId;
const ID_B = '019aa0a0-0000-7000-8000-000000000002' as AccountId;
const anAccount = (id = ID_A, email = 'ana@example.com') =>
  Account.create(id, toEmail(email), '$scrypt$ln=15,r=8,p=3$c2FsdA$aGFzaA' as PasswordHash, NOW);

describe.skipIf(!url)('SQL auth repositories', () => {
  let db: Kysely<Database>;

  beforeAll(async () => {
    db = createDatabase(url ?? '');
    const migrationFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../db/migrations');
    const { error } = await new Migrator({
      db,
      provider: new FileMigrationProvider({ fs, path, migrationFolder }),
    }).migrateToLatest();
    if (error) throw error;
  });
  // Other integration tests use the same database at the same time, so only this test's rows are removed.
  beforeEach(async () => {
    await db.deleteFrom('accounts').where('id', 'in', [ID_A, ID_B]).execute();
  });
  afterAll(async () => {
    await db.destroy();
  });

  it('finds an added account by its address and by its id', async () => {
    const accounts = createSqlAccountRepository(db);
    await accounts.add(anAccount());

    expect((await accounts.findByEmail(toEmail('ana@example.com')))?.id).toBe(ID_A);
    expect((await accounts.findById(ID_A))?.email).toBe('ana@example.com');
  });

  it('refuses a second account with the same address', async () => {
    const accounts = createSqlAccountRepository(db);
    await accounts.add(anAccount());

    expect(await accounts.add(anAccount(ID_B))).toBe(false);
  });

  it('saves the lock and the new password hash', async () => {
    const accounts = createSqlAccountRepository(db);
    const account = anAccount();
    await accounts.add(account);
    account.recordFailedLogin(NOW);
    account.changePassword('$scrypt$ln=15,r=8,p=3$bmV3$bmV3' as PasswordHash);

    await accounts.save(account);

    expect((await accounts.findById(ID_A))?.snapshot()).toMatchObject({
      failedLogins: 1,
      passwordHash: '$scrypt$ln=15,r=8,p=3$bmV3$bmV3',
    });
  });

  it('removes every session of an account except the one kept', async () => {
    const accounts = createSqlAccountRepository(db);
    const sessions = createSqlSessionRepository(db);
    await accounts.add(anAccount());
    await accounts.add(anAccount(ID_B, 'ben@example.com'));
    await sessions.add(startSession('keep' as SessionTokenHash, ID_A, NOW));
    await sessions.add(startSession('drop' as SessionTokenHash, ID_A, NOW));
    await sessions.add(startSession('other' as SessionTokenHash, ID_B, NOW));

    await sessions.removeAllFor(ID_A, 'keep' as SessionTokenHash);

    expect(await sessions.find('keep' as SessionTokenHash)).not.toBeNull();
    expect(await sessions.find('drop' as SessionTokenHash)).toBeNull();
    expect(await sessions.find('other' as SessionTokenHash)).not.toBeNull();
  });

  it('drops the sessions of a deleted account', async () => {
    const accounts = createSqlAccountRepository(db);
    const sessions = createSqlSessionRepository(db);
    await accounts.add(anAccount());
    await sessions.add(startSession('s1' as SessionTokenHash, ID_A, NOW));

    await db.deleteFrom('accounts').where('id', '=', ID_A).execute();

    expect(await sessions.find('s1' as SessionTokenHash)).toBeNull();
  });

  describe('email verifications', () => {
    const LINK = 'link-hash-a' as SessionTokenHash;
    const added = async () => {
      await createSqlAccountRepository(db).add(anAccount());
      const verifications = createSqlEmailVerificationRepository(db);
      await verifications.add(startVerification(LINK, 'code-hash-a' as CodeHash, ID_A, NOW));
      return verifications;
    };

    it('finds a verification by its link and by its account, code hash included', async () => {
      const verifications = await added();

      expect(await verifications.find(LINK)).toMatchObject({ accountId: ID_A, codeHash: 'code-hash-a' });
      expect(await verifications.findFor(ID_A)).toMatchObject({ tokenHash: LINK, codeHash: 'code-hash-a' });
    });

    it('counts code tries up to the limit and refuses the next', async () => {
      const verifications = await added();
      await verifications.countCodeAttempt(LINK, 2);

      expect(await verifications.countCodeAttempt(LINK, 2)).toBe(true);
      expect(await verifications.countCodeAttempt(LINK, 2)).toBe(false);
    });

    it('lets only the allowed number of tries through when they arrive at the same moment', async () => {
      const verifications = await added();

      const results = await Promise.all(Array.from({ length: 10 }, () => verifications.countCodeAttempt(LINK, 5)));

      expect(results.filter(Boolean)).toHaveLength(5);
    });

    it('forgets the verification of the account', async () => {
      const verifications = await added();

      await verifications.removeAllFor(ID_A);

      expect(await verifications.findFor(ID_A)).toBeNull();
    });
  });
});
