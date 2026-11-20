import type { NotificationSettingsDto } from '../../../shared/api/contracts.js';
import type { NotificationSettingsRepository } from '../domain/ports.js';

export interface NotificationsDependencies {
  readonly settings: NotificationSettingsRepository;
}

export async function notificationSettings(
  deps: NotificationsDependencies,
  accountId: string,
): Promise<NotificationSettingsDto> {
  return { stepReminders: await deps.settings.stepReminders(accountId) };
}

export async function changeNotificationSettings(
  deps: NotificationsDependencies,
  accountId: string,
  change: NotificationSettingsDto,
): Promise<NotificationSettingsDto> {
  await deps.settings.setStepReminders(accountId, change.stepReminders);
  return notificationSettings(deps, accountId);
}
