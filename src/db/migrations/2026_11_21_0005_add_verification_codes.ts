import { sql, type Kysely } from 'kysely';

// Migrations use Kysely<unknown> on purpose: they must keep working after the schema types change.
export async function up(db: Kysely<unknown>): Promise<void> {
  // Links sent before codes existed have no code; the player asks for a new e-mail, which has both.
  await sql`delete from email_verifications`.execute(db);
  await db.schema
    .alterTable('email_verifications')
    // The six-digit code from the same e-mail, hashed together with the link's hash.
    .addColumn('code_hash', 'text', (col) => col.notNull())
    // Tries of the code so far, counted before each comparison.
    .addColumn('code_attempts', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();
  // Typing a code finds the account's confirmation by the account, not by the link.
  await db.schema
    .createIndex('email_verifications_account_id')
    .on('email_verifications')
    .column('account_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('email_verifications_account_id').execute();
  await db.schema.alterTable('email_verifications').dropColumn('code_attempts').dropColumn('code_hash').execute();
}
