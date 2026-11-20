import type { WorldEventsResponse } from '../../../shared/api/contracts.js';
import type { WorldEventId } from '../../../shared/achievements/worldEvents.js';
import type { Clock, SightingRepository } from '../domain/ports.js';

export interface AchievementsDependencies {
  readonly sightings: SightingRepository;
  readonly clock: Clock;
}

async function view(deps: AchievementsDependencies, accountId: string): Promise<WorldEventsResponse> {
  const seen = await deps.sightings.listByAccount(accountId);
  return { seen: seen.map(({ event, seenAt }) => ({ id: event, seenAt: seenAt.toISOString() })) };
}

export function worldEvents(deps: AchievementsDependencies, accountId: string): Promise<WorldEventsResponse> {
  return view(deps, accountId);
}

/** Notes that the player saw `event` now; seeing it again later keeps the first time. */
export async function recordWorldEvent(
  deps: AchievementsDependencies,
  accountId: string,
  event: WorldEventId,
): Promise<WorldEventsResponse> {
  await deps.sightings.record(accountId, event, deps.clock.now());
  return view(deps, accountId);
}
