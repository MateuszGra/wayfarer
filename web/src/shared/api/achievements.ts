import type { SightingId } from '@shared/achievements/worldEvents';
import type { WorldEventsResponse } from '@shared/api/contracts';
import { apiGet, apiPut } from '@/shared/api/client';

/** The moments in the world the player has seen. */
export function fetchWorldEvents(): Promise<WorldEventsResponse> {
  return apiGet<WorldEventsResponse>('/achievements/world');
}

/** Notes that the player saw `event`; seeing it again keeps the first time. */
export function recordWorldEvent(event: SightingId): Promise<WorldEventsResponse> {
  return apiPut<WorldEventsResponse>(`/achievements/world/${event}`, {});
}
