import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Kysely } from 'kysely';
import { FileMigrationProvider, Migrator } from 'kysely/migration';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../../db/database';
import type { Database } from '../../../db/schema';
import { createSqlSightingRepository } from './sqlSightingRepository';

// Runs against the separate wayfarer_test database (see docker/postgres/init.sql); skipped without it.
const url = process.env['TEST_DATABASE_URL'];
const ACCOUNT = '019aa0a0-0000-7000-8000-0000000000c1';
const FIRST = new Date('2026-11-20T19:30:00Z');

describe.skipIf(!url)('SQL sighting repository', () => {
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
    await db.deleteFrom('accounts').where('id', '=', ACCOUNT).execute();
    await db
      .insertInto('accounts')
      .values({ id: ACCOUNT, email: 'sightings@example.com', password_hash: '$scrypt$ln=15,r=8,p=3$c2FsdA$aGFzaA' })
      .execute();
  });
  afterAll(async () => {
    await db.deleteFrom('accounts').where('id', '=', ACCOUNT).execute();
    await db.destroy();
  });

  it('keeps the first time an event was seen when it is recorded again', async () => {
    const sightings = createSqlSightingRepository(db);
    await sightings.record(ACCOUNT, 'bigfootSeen', FIRST);

    await sightings.record(ACCOUNT, 'bigfootSeen', new Date('2026-11-21T06:00:00Z'));

    expect(await sightings.listByAccount(ACCOUNT)).toEqual([{ event: 'bigfootSeen', seenAt: FIRST }]);
  });
});
