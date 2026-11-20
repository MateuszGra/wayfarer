import type { SightingId } from '../../../shared/achievements/worldEvents.js';

export interface Sighting {
  readonly event: SightingId;
  readonly seenAt: Date;
}

/** The world events each player has seen. Recording one twice keeps the first time it was seen. */
export interface SightingRepository {
  listByAccount(accountId: string): Promise<readonly Sighting[]>;
  record(accountId: string, event: SightingId, at: Date): Promise<void>;
}

export interface Clock {
  now(): Date;
}
