// The step reminders job, run from cron every 15 minutes (see README, "Deploying to MyDevil"). It sends
// what is due and exits; running it twice or late is safe.
import { existsSync } from 'node:fs';
import { createDatabase } from '../db/database.js';
import { createSmtpMailer, createSqlReminders, sendStepReminders } from '../modules/notifications/index.js';
import { readConfig, readMailConfig } from '../server/config.js';

// Cron starts it without --env-file, like Passenger starts the server, so the .env next to it is loaded here.
if (existsSync('.env') && !process.env['DATABASE_URL']) process.loadEnvFile('.env');

const config = readConfig();
const mail = readMailConfig();
if (!mail) {
  console.error('Step reminders: no SMTP_* settings in .env, so nothing can be sent.');
  process.exit(1);
}

const db = createDatabase(config.databaseUrl);
try {
  const run = await sendStepReminders({
    reminders: createSqlReminders(db),
    mailer: createSmtpMailer(mail),
    clock: { now: () => new Date() },
    appUrl: mail.appUrl,
  });
  // Quiet when there was nothing to send, so cron mails no output every 15 minutes.
  if (run.sent > 0 || run.failed > 0) console.log(`Step reminders: ${run.sent} sent, ${run.failed} failed.`);
  if (run.failed > 0) process.exitCode = 1;
} finally {
  await db.destroy();
}
