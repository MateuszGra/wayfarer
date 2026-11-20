import type { Kysely } from 'kysely';
import type { Database } from '../../../db/schema.js';
import { Journey } from '../domain/journey.js';
import type { JourneyRepository } from '../domain/ports.js';

export function createSqlJourneyRepository(db: Kysely<Database>): JourneyRepository {
  return {
    async findByAccount(accountId) {
      const row = await db.selectFrom('journeys').selectAll().where('account_id', '=', accountId).executeTakeFirst();
      if (!row) return null;
      const entries = await db
        .selectFrom('step_entries')
        .select(['steps_date', 'steps', 'entered_at_hour'])
        .where('journey_id', '=', row.id)
        .orderBy('steps_date')
        .execute();
      return Journey.restore({
        id: row.id,
        accountId: row.account_id,
        routeId: row.route_id,
        dailySteps: row.daily_steps,
        timeZone: row.time_zone,
        startedOn: row.started_on,
        routeSinceKm: row.route_since_km,
        entries: entries.map((e) => ({ date: e.steps_date, steps: e.steps, enteredAtHour: e.entered_at_hour })),
      });
    },
    async add(journey) {
      const s = journey.snapshot();
      const inserted = await db
        .insertInto('journeys')
        .values({
          id: s.id,
          account_id: s.accountId,
          route_id: s.routeId,
          daily_steps: s.dailySteps,
          time_zone: s.timeZone,
          started_on: s.startedOn,
          route_since_km: s.routeSinceKm,
        })
        .onConflict((oc) => oc.column('account_id').doNothing())
        .returning('id')
        .executeTakeFirst();
      return inserted !== undefined;
    },
    async savePlan(journey) {
      const s = journey.snapshot();
      await db
        .updateTable('journeys')
        .set({
          route_id: s.routeId,
          daily_steps: s.dailySteps,
          started_on: s.startedOn,
          route_since_km: s.routeSinceKm,
        })
        .where('id', '=', s.id)
        .execute();
    },
    async saveEntry(journeyId, entry) {
      await db
        .insertInto('step_entries')
        .values({
          journey_id: journeyId,
          steps_date: entry.date,
          steps: entry.steps,
          entered_at_hour: entry.enteredAtHour,
        })
        // A correction changes the steps only: the hour of the first entry stays, so does the walk.
        .onConflict((oc) =>
          oc.columns(['journey_id', 'steps_date']).doUpdateSet({ steps: entry.steps, updated_at: new Date() }),
        )
        .execute();
    },
  };
}
