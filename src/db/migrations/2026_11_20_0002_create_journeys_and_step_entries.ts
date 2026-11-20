import { sql, type Kysely } from 'kysely';

// Migrations use Kysely<unknown> on purpose: they must keep working after the schema types change.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('journeys')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    // One journey per account for now; changing route or goal updates it rather than starting another.
    .addColumn('account_id', 'uuid', (col) => col.notNull().unique().references('accounts.id').onDelete('cascade'))
    .addColumn('route_id', 'text', (col) => col.notNull())
    .addColumn('daily_steps', 'integer', (col) => col.notNull())
    // IANA zone of the player: it decides what "today" and "yesterday" are for this journey.
    .addColumn('time_zone', 'text', (col) => col.notNull())
    .addColumn('started_on', 'date')
    // Distance walked before the current route was chosen; the position on the route starts from it.
    .addColumn('route_since_km', 'double precision', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('step_entries')
    .addColumn('journey_id', 'uuid', (col) => col.notNull().references('journeys.id').onDelete('cascade'))
    // The day the player walked these steps; the traveller walks them the day after.
    .addColumn('steps_date', 'date', (col) => col.notNull())
    .addColumn('steps', 'integer', (col) => col.notNull())
    // Local hour on the walk day when first entered: the walk on screen can't start before it.
    .addColumn('entered_at_hour', 'double precision', (col) => col.notNull())
    .addColumn('entered_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addPrimaryKeyConstraint('step_entries_pk', ['journey_id', 'steps_date'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('step_entries').execute();
  await db.schema.dropTable('journeys').execute();
}
