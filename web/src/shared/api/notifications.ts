import type { NotificationSettingsDto } from '@shared/api/contracts';
import { apiGet, apiPut } from '@/shared/api/client';

export function fetchNotificationSettings(): Promise<NotificationSettingsDto> {
  return apiGet<NotificationSettingsDto>('/notifications/settings');
}

export function saveNotificationSettings(settings: NotificationSettingsDto): Promise<NotificationSettingsDto> {
  return apiPut<NotificationSettingsDto>('/notifications/settings', settings);
}
