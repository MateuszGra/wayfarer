import { sql, type Kysely } from 'kysely';

// Migrations use Kysely<unknown> on purpose: they must keep working after the schema types change.
export async function up(db: Kysely<unknown>): Promise<void> {
  // One-time links for setting a new password: only the SHA-256 of the token is kept, like for sessions.
  await db.schema
    .createTable('password_resets')
    .addColumn('token_hash', 'text', (col) => col.primaryKey())
    .addColumn('account_id', 'uuid', (col) => col.notNull().references('accounts.id').onDelete('cascade'))
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('password_resets').execute();
}
