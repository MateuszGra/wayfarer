import { existsSync } from 'node:fs';
import { sql } from 'kysely';
import { createDatabase } from '../db/database.js';
import { createStaticRouteCatalog } from '../modules/routes/index.js';
import { buildApp } from './app.js';
import { readConfig } from './config.js';

// On MyDevil, Passenger starts app.js without --env-file, so the .env next to it is loaded here.
if (existsSync('.env') && !process.env['DATABASE_URL']) process.loadEnvFile('.env');

const config = readConfig();
const db = createDatabase(config.databaseUrl);

const app = await buildApp({
  checkDatabase: async () => {
    await sql`select 1`.execute(db);
  },
  routeCatalog: createStaticRouteCatalog(),
  publicDir: 'public',
  logger: true,
});

const shutdown = async (): Promise<void> => {
  await app.close();
  await db.destroy();
};
process.once('SIGTERM', () => void shutdown());
process.once('SIGINT', () => void shutdown());

await app.listen({ port: config.port, host: '0.0.0.0' });
