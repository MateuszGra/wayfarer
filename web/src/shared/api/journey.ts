import type { JourneyResponse } from '@shared/api/contracts';
import { apiGet, apiPost, apiPut, ApiRequestError } from '@/shared/api/client';

/** The player's journey and today on it, or null before one is planned. */
export async function fetchJourney(): Promise<JourneyResponse | null> {
  try {
    return await apiGet<JourneyResponse>('/journey');
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === 'journey_not_found') return null;
    throw error;
  }
}

export function planJourney(routeId: string, dailySteps: number, timeZone: string): Promise<JourneyResponse> {
  return apiPost<JourneyResponse>('/journey', { routeId, dailySteps, timeZone });
}

export function changeJourney(routeId: string, dailySteps: number): Promise<JourneyResponse> {
  return apiPut<JourneyResponse>('/journey', { routeId, dailySteps });
}

/** Records (or corrects, the same day) the steps the player walked yesterday. */
export function recordYesterdaySteps(steps: number): Promise<JourneyResponse> {
  return apiPut<JourneyResponse>('/journey/steps', { steps });
}
