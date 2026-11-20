// Public API of the notifications module. Other modules, the server and jobs import only from here.
export type { NotificationsDependencies } from './application/notificationSettingsService.js';
export {
  sendStepReminders,
  type ReminderRun,
  type StepRemindersDependencies,
} from './application/stepRemindersService.js';
export type { Mailer } from './domain/ports.js';
export { registerNotificationsHttp, type NotificationsHttpOptions } from './infrastructure/notificationsHttp.js';
export { createSmtpMailer, type SmtpSettings } from './infrastructure/smtpMailer.js';
export { createSqlNotificationSettings, createSqlReminders } from './infrastructure/sqlNotifications.js';
export { createInMemoryNotifications } from './testing/inMemoryNotifications.js';
