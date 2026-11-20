import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { Database } from './schema.js';

// A DATE column is a calendar day in the player's time zone, not an instant. pg would turn it into a
// Date at the server's local midnight; reading it as the plain `YYYY-MM-DD` string keeps it a day.
const PG_DATE = 1082;
pg.types.setTypeParser(PG_DATE, (value: string) => value);

export function createDatabase(connectionString: string): Kysely<Database> {
  return new Kysely<Database>({ dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString }) }) });
}
