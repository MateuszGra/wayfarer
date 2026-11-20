import type { NotificationsDependencies } from '../application/notificationSettingsService.js';

/** Notification settings without a database. */
export function createInMemoryNotifications(): NotificationsDependencies {
  const reminders = new Map<string, boolean>();
  return {
    settings: {
      async stepReminders(accountId) {
        return reminders.get(accountId) ?? true;
      },
      async setStepReminders(accountId, on) {
        reminders.set(accountId, on);
      },
    },
  };
}
