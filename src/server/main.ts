import { existsSync } from 'node:fs';
import { sql } from 'kysely';
import { createDatabase } from '../db/database.js';
import {
  AttemptLimiter,
  createScryptHasher,
  createPwnedPasswords,
  createSqlAccountRepository,
  createSqlEmailVerificationRepository,
  createSqlOneTimeLinkRepository,
  createSqlSessionRepository,
  sessionTokens,
  uuidv7,
  verificationCodes,
  type AccountId,
  type Mailer,
} from '../modules/auth/index.js';
import { createSqlJourneyRepository } from '../modules/journey/index.js';
import { createSqlSightingRepository } from '../modules/achievements/index.js';
import { createSmtpMailer, createSqlNotificationSettings } from '../modules/notifications/index.js';
import { createStaticRouteCatalog } from '../modules/routes/index.js';
import { createOpenMeteo, createWeatherService, DEFAULT_REGION } from '../modules/weather/index.js';
import { buildApp } from './app.js';
import { readConfig, readMailConfig } from './config.js';

// On MyDevil, Passenger starts app.js without --env-file, so the .env next to it is loaded here.
if (existsSync('.env') && !process.env['DATABASE_URL']) process.loadEnvFile('.env');

const config = readConfig();
if (config.devPassword)
  console.warn(`DEV_LOGIN is on: the password "${config.devPassword}" signs in with any address.`);
const db = createDatabase(config.databaseUrl);

const mail = readMailConfig();
// Without a mailbox (local development) e-mails are printed to the log, links included, so they can be
// followed by hand; in production a missing mailbox is a configuration error that each send reports.
const mailer: Mailer = mail
  ? createSmtpMailer(mail)
  : {
      async send(message) {
        if (process.env['NODE_ENV'] === 'production') throw new Error('SMTP_* is not set in .env');
        console.info(`[mail to ${message.to}] ${message.subject}\n${message.text}`);
      },
    };

const routeCatalog = createStaticRouteCatalog();

const app = await buildApp({
  checkDatabase: async () => {
    await sql`select 1`.execute(db);
  },
  routeCatalog,
  weather: createWeatherService({ source: createOpenMeteo(), clock: { now: () => new Date() } }),
  journey: {
    journeys: createSqlJourneyRepository(db),
    routes: { exists: async (id) => (await routeCatalog.all()).some((route) => route.id === id) },
    clock: { now: () => new Date() },
    newId: () => uuidv7(new Date()),
    place: DEFAULT_REGION,
  },
  achievements: { sightings: createSqlSightingRepository(db), clock: { now: () => new Date() } },
  notifications: { settings: createSqlNotificationSettings(db) },
  auth: {
    accounts: createSqlAccountRepository(db),
    sessions: createSqlSessionRepository(db),
    verifications: createSqlEmailVerificationRepository(db),
    codes: verificationCodes,
    passwordResets: createSqlOneTimeLinkRepository(db, 'password_resets'),
    mailer,
    appUrl: mail?.appUrl ?? process.env['APP_URL'] ?? 'http://localhost:5173',
    onMailError: (error) => console.error('Could not send an e-mail', error),
    hasher: createScryptHasher(),
    breached: createPwnedPasswords(fetch, (error) => console.warn('Pwned Passwords unavailable', error)),
    tokens: sessionTokens,
    clock: { now: () => new Date() },
    ids: { accountId: () => uuidv7(new Date()) as AccountId },
    devPassword: config.devPassword,
  },
  // 30 attempts per address in 15 minutes covers a household behind one router, not a guessing script.
  authHttp: { secureCookies: config.secureCookies, limiter: new AttemptLimiter(30, 15 * 60 * 1000) },
  trustProxy: config.trustProxy,
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
