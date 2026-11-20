import { sql, type Kysely } from 'kysely';

// Migrations use Kysely<unknown> on purpose: they must keep working after the schema types change.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('world_sightings')
    .addColumn('account_id', 'uuid', (col) => col.notNull().references('accounts.id').onDelete('cascade'))
    // One of the world events in src/shared/achievements/worldEvents.ts.
    .addColumn('event', 'text', (col) => col.notNull())
    // The first time the player saw it; seeing it again changes nothing.
    .addColumn('seen_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addPrimaryKeyConstraint('world_sightings_pk', ['account_id', 'event'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('world_sightings').execute();
}
