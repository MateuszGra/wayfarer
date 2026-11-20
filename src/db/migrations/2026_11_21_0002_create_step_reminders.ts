import { sql, type Kysely } from 'kysely';

// Migrations use Kysely<unknown> on purpose: they must keep working after the schema types change.
export async function up(db: Kysely<unknown>): Promise<void> {
  // A player's choices about notifications. No row means the defaults: reminders on.
  await db.schema
    .createTable('notification_settings')
    .addColumn('account_id', 'uuid', (col) => col.primaryKey().references('accounts.id').onDelete('cascade'))
    .addColumn('step_reminders', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();
  // Each reminder sent, so a cron run that overlaps another, or runs again, never sends it twice.
  await db.schema
    .createTable('sent_reminders')
    .addColumn('account_id', 'uuid', (col) => col.notNull().references('accounts.id').onDelete('cascade'))
    // The day in the player's own time zone.
    .addColumn('local_date', 'date', (col) => col.notNull())
    // 'morning' (10:00) or 'evening' (22:00).
    .addColumn('slot', 'text', (col) => col.notNull())
    .addColumn('sent_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addPrimaryKeyConstraint('sent_reminders_pk', ['account_id', 'local_date', 'slot'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('sent_reminders').execute();
  await db.schema.dropTable('notification_settings').execute();
}
