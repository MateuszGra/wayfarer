import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Kysely } from 'kysely';
import { FileMigrationProvider, Migrator } from 'kysely/migration';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../../db/database';
import type { Database } from '../../../db/schema';
import { createSqlNotificationSettings, createSqlReminders } from './sqlNotifications';

// Runs against the separate wayfarer_test database (see docker/postgres/init.sql); skipped without it.
const url = process.env['TEST_DATABASE_URL'];
const ACCOUNT = '019aa0a0-0000-7000-8000-0000000000d1';
const JOURNEY = '019aa0a0-0000-7000-8000-0000000000d2';

describe.skipIf(!url)('SQL notifications', () => {
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
      .values({ id: ACCOUNT, email: 'reminders@example.com', password_hash: '$scrypt$ln=15,r=8,p=3$c2FsdA$aGFzaA' })
      .execute();
    await db
      .insertInto('journeys')
      .values({
        id: JOURNEY,
        account_id: ACCOUNT,
        route_id: 'baltic-santiago',
        daily_steps: 10000,
        time_zone: 'Europe/Warsaw',
        started_on: '2026-11-18',
      })
      .execute();
    await db
      .insertInto('step_entries')
      .values([
        { journey_id: JOURNEY, steps_date: '2026-11-18', steps: 9000, entered_at_hour: 9 },
        { journey_id: JOURNEY, steps_date: '2026-11-19', steps: 12000, entered_at_hour: 8 },
      ])
      .execute();
  });
  afterAll(async () => {
    await db.deleteFrom('accounts').where('id', '=', ACCOUNT).execute();
    await db.destroy();
  });

  const mine = async () => (await createSqlReminders(db).candidates()).find((c) => c.accountId === ACCOUNT);

  it('lists a player with a journey, their time zone and the last day they entered steps for', async () => {
    expect(await mine()).toEqual({
      accountId: ACCOUNT,
      email: 'reminders@example.com',
      timeZone: 'Europe/Warsaw',
      lastStepsDate: '2026-11-19',
      sent: [],
    });
  });

  it('leaves out a player who turned reminders off', async () => {
    await createSqlNotificationSettings(db).setStepReminders(ACCOUNT, false);

    expect(await mine()).toBeUndefined();
  });

  it('claims a reminder only once', async () => {
    const reminders = createSqlReminders(db);
    const today = new Date().toISOString().slice(0, 10);

    const first = await reminders.claim(ACCOUNT, today, 'morning');
    const second = await reminders.claim(ACCOUNT, today, 'morning');

    expect([first, second]).toEqual([true, false]);
    expect((await mine())?.sent).toEqual([{ date: today, slot: 'morning' }]);
  });
});
