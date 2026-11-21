import { sql, type Kysely } from 'kysely';

// Migrations use Kysely<unknown> on purpose: they must keep working after the schema types change.
export async function up(db: Kysely<unknown>): Promise<void> {
  // When the player confirmed the address by the link in the e-mail; signing in waits for it.
  await db.schema.alterTable('accounts').addColumn('email_verified_at', 'timestamptz').execute();
  // Accounts made before confirmation existed belong to players who already use the game.
  await sql`update accounts set email_verified_at = now()`.execute(db);
  // One-time confirmation links: only the SHA-256 of the token is kept, like for sessions.
  await db.schema
    .createTable('email_verifications')
    .addColumn('token_hash', 'text', (col) => col.primaryKey())
    .addColumn('account_id', 'uuid', (col) => col.notNull().references('accounts.id').onDelete('cascade'))
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('email_verifications').execute();
  await db.schema.alterTable('accounts').dropColumn('email_verified_at').execute();
}
