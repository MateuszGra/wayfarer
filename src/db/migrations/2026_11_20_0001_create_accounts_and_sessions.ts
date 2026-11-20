import { sql, type Kysely } from 'kysely';

// Migrations use Kysely<unknown> on purpose: they must keep working after the schema types change.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('accounts')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    // Stored normalized (trimmed, lowercase) by the application, so a plain unique index is enough.
    .addColumn('email', 'text', (col) => col.notNull().unique())
    // PHC string: algorithm, parameters, the per-password salt and the hash, all in one value.
    .addColumn('password_hash', 'text', (col) => col.notNull())
    .addColumn('failed_logins', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('locked_until', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('sessions')
    // SHA-256 of the token in the player's cookie; the token itself is never stored.
    .addColumn('token_hash', 'text', (col) => col.primaryKey())
    .addColumn('account_id', 'uuid', (col) => col.notNull().references('accounts.id').onDelete('cascade'))
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();
  await db.schema.createIndex('sessions_account_id_idx').on('sessions').column('account_id').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('sessions').execute();
  await db.schema.dropTable('accounts').execute();
}
