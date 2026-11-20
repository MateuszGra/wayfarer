import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Kysely } from 'kysely';
import { FileMigrationProvider, Migrator } from 'kysely/migration';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../../db/database';
import type { Database } from '../../../db/schema';
import { Journey } from '../domain/journey';
import { createSqlJourneyRepository } from './sqlJourneyRepository';

// Runs against the separate wayfarer_test database (see docker/postgres/init.sql); skipped without it.
const url = process.env['TEST_DATABASE_URL'];
const ACCOUNT = '019aa0a0-0000-7000-8000-0000000000a1';
const JOURNEY = '019aa0a0-0000-7000-8000-0000000000b1';

describe.skipIf(!url)('SQL journey repository', () => {
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
  // Other integration tests use the same database at the same time, so only this test's rows are touched.
  beforeEach(async () => {
    await db.deleteFrom('accounts').where('id', '=', ACCOUNT).execute();
    await db
      .insertInto('accounts')
      .values({ id: ACCOUNT, email: 'journey-test@example.com', password_hash: 'x' })
      .execute();
  });
  afterAll(async () => {
    await db.destroy();
  });

  it('reads back the start day and step dates as plain calendar days', async () => {
    const journeys = createSqlJourneyRepository(db);
    const journey = Journey.create(JOURNEY, ACCOUNT, 'baltic-santiago', 10_000, 'Europe/Warsaw');
    await journeys.add(journey);
    const entry = journey.recordYesterday(8_000, new Date('2026-11-20T07:00:00Z'));
    await journeys.saveEntry(JOURNEY, entry);
    await journeys.savePlan(journey);

    const stored = (await journeys.findByAccount(ACCOUNT))?.snapshot();

    expect(stored?.startedOn).toBe('2026-11-20');
    expect(stored?.entries).toEqual([{ date: '2026-11-19', steps: 8_000, enteredAtHour: 8 }]);
  });

  it('refuses a second journey for the same account', async () => {
    const journeys = createSqlJourneyRepository(db);
    await journeys.add(Journey.create(JOURNEY, ACCOUNT, 'baltic-santiago', 10_000, 'Europe/Warsaw'));

    const second = await journeys.add(
      Journey.create('019aa0a0-0000-7000-8000-0000000000b2', ACCOUNT, 'baltic-santiago', 10_000, 'Europe/Warsaw'),
    );

    expect(second).toBe(false);
  });

  it('corrects a day steps without moving the hour they were first entered', async () => {
    const journeys = createSqlJourneyRepository(db);
    await journeys.add(Journey.create(JOURNEY, ACCOUNT, 'baltic-santiago', 10_000, 'Europe/Warsaw'));
    await journeys.saveEntry(JOURNEY, { date: '2026-11-19', steps: 8_000, enteredAtHour: 8 });

    await journeys.saveEntry(JOURNEY, { date: '2026-11-19', steps: 9_000, enteredAtHour: 15 });

    expect((await journeys.findByAccount(ACCOUNT))?.snapshot().entries).toEqual([
      { date: '2026-11-19', steps: 9_000, enteredAtHour: 8 },
    ]);
  });
});
