import type { AchievementsDependencies } from '../application/worldEventsService.js';
import type { Sighting } from '../domain/ports.js';

/** Achievements without a database: sightings in a map, a clock fixed at `now`. */
export function createInMemoryAchievements(now = new Date('2026-11-20T18:00:00Z')): AchievementsDependencies {
  const byAccount = new Map<string, Sighting[]>();
  return {
    clock: { now: () => now },
    sightings: {
      async listByAccount(accountId) {
        return byAccount.get(accountId) ?? [];
      },
      async record(accountId, event, at) {
        const seen = byAccount.get(accountId) ?? [];
        if (!seen.some((s) => s.event === event)) byAccount.set(accountId, [...seen, { event, seenAt: at }]);
      },
    },
  };
}
