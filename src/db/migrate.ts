import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileMigrationProvider, Migrator } from 'kysely/migration';
import { readConfig } from '../server/config.js';
import { createDatabase } from './database.js';

const direction = process.argv[2] === 'down' ? 'down' : 'latest';
const db = createDatabase(readConfig().databaseUrl);
const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations'),
  }),
});

const { error, results } = direction === 'down' ? await migrator.migrateDown() : await migrator.migrateToLatest();
for (const result of results ?? []) console.log(`${result.status}: ${result.migrationName} (${result.direction})`);
await db.destroy();
if (error) {
  console.error(error);
  process.exit(1);
}
