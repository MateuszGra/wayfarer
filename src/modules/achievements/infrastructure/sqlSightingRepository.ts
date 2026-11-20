import type { Kysely } from 'kysely';
import { isWorldEvent } from '../../../shared/achievements/worldEvents.js';
import type { Database } from '../../../db/schema.js';
import type { Sighting, SightingRepository } from '../domain/ports.js';

export function createSqlSightingRepository(db: Kysely<Database>): SightingRepository {
  return {
    async listByAccount(accountId) {
      const rows = await db
        .selectFrom('world_sightings')
        .select(['event', 'seen_at'])
        .where('account_id', '=', accountId)
        .orderBy('seen_at')
        .execute();
      // An event no longer in the game is left out rather than failing the whole list.
      return rows.flatMap((row): Sighting[] =>
        isWorldEvent(row.event) ? [{ event: row.event, seenAt: row.seen_at }] : [],
      );
    },
    async record(accountId, event, at) {
      await db
        .insertInto('world_sightings')
        .values({ account_id: accountId, event, seen_at: at })
        .onConflict((oc) => oc.columns(['account_id', 'event']).doNothing())
        .execute();
    },
  };
}
