import { sql, type Kysely } from 'kysely';
import type { Database } from '../../../db/schema.js';
import type { NotificationSettingsRepository, ReminderRepository } from '../domain/ports.js';
import type { ReminderSlot, SentReminder } from '../domain/stepReminder.js';

const SLOTS: readonly string[] = ['morning', 'evening'] satisfies readonly ReminderSlot[];

export function createSqlNotificationSettings(db: Kysely<Database>): NotificationSettingsRepository {
  return {
    async stepReminders(accountId) {
      const row = await db
        .selectFrom('notification_settings')
        .select('step_reminders')
        .where('account_id', '=', accountId)
        .executeTakeFirst();
      return row?.step_reminders ?? true;
    },
    async setStepReminders(accountId, on) {
      await db
        .insertInto('notification_settings')
        .values({ account_id: accountId, step_reminders: on })
        .onConflict((oc) => oc.column('account_id').doUpdateSet({ step_reminders: on, updated_at: sql`now()` }))
        .execute();
    },
  };
}

/**
 * Reads accounts, journeys and step entries directly: a read-only view across modules for the reminder
 * job, which runs outside the web server and would otherwise load every journey whole.
 */
export function createSqlReminders(db: Kysely<Database>): ReminderRepository {
  return {
    async candidates() {
      const players = await db
        .selectFrom('accounts as a')
        .innerJoin('journeys as j', 'j.account_id', 'a.id')
        .leftJoin('notification_settings as n', 'n.account_id', 'a.id')
        .select((eb) => [
          'a.id as accountId',
          'a.email',
          'j.time_zone as timeZone',
          eb
            .selectFrom('step_entries as e')
            .whereRef('e.journey_id', '=', 'j.id')
            .select((inner) => inner.fn.max('e.steps_date').as('last'))
            .as('lastStepsDate'),
        ])
        .where(sql<boolean>`coalesce(n.step_reminders, true)`)
        .execute();
      // Two days back covers every time zone's "today".
      const sent = await db
        .selectFrom('sent_reminders')
        .select(['account_id', 'local_date', 'slot'])
        .where('local_date', '>=', sql<string>`current_date - 2`)
        .execute();
      const sentBy = new Map<string, SentReminder[]>();
      for (const row of sent) {
        if (!SLOTS.includes(row.slot)) continue;
        const list = sentBy.get(row.account_id) ?? [];
        list.push({ date: row.local_date, slot: row.slot as ReminderSlot });
        sentBy.set(row.account_id, list);
      }
      return players.map((player) => ({
        accountId: player.accountId,
        email: player.email,
        timeZone: player.timeZone,
        lastStepsDate: player.lastStepsDate ?? null,
        sent: sentBy.get(player.accountId) ?? [],
      }));
    },
    async claim(accountId, date, slot) {
      const result = await db
        .insertInto('sent_reminders')
        .values({ account_id: accountId, local_date: date, slot })
        .onConflict((oc) => oc.columns(['account_id', 'local_date', 'slot']).doNothing())
        .executeTakeFirst();
      return Number(result.numInsertedOrUpdatedRows ?? 0) > 0;
    },
    async release(accountId, date, slot) {
      await db
        .deleteFrom('sent_reminders')
        .where('account_id', '=', accountId)
        .where('local_date', '=', date)
        .where('slot', '=', slot)
        .execute();
    },
  };
}
