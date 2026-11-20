import { FULL_BEARD_DAYS } from '../wanderer/beard.js';
import { BIRD_SPECIES, WORLD_EVENTS, type SightingId, type WorldEventId } from './worldEvents.js';

/**
 * Collectible trophies. Most are won once the player's total steps on the road reach their threshold; one
 * by steps in a single day, a streak trophy by reaching the daily goal on a number of days in a row, and
 * the beard trophy by days on the road.
 */
export const TROPHIES = [
  // Walking all of San Andreas in a single day.
  { id: 'aezakmi', measure: 'bestDay', goal: 20_000 },
  { id: 'dragonborn', measure: 'steps', goal: 70_000 },
  { id: 'tenOutOfTen', measure: 'streak', goal: 10 },
  { id: 'kremowka', measure: 'steps', goal: 213_700 },
  // The wanderer's beard is full after this many days on the road (see src/shared/wanderer/beard.ts).
  { id: 'blaviken', measure: 'days', goal: FULL_BEARD_DAYS },
  // A "Sasin" is the jokey unit of 70 million zloty spent on the postal election that never happened;
  // the small one here is a hundredth of it, in steps.
  { id: 'postalVote', measure: 'steps', goal: 700_000 },
  { id: 'ringBearer', measure: 'steps', goal: 3_800_000 },
  { id: 'forrest', measure: 'steps', goal: 6_500_000 },
  { id: 'twardowski', measure: 'steps', goal: 500_000_000 },
] as const;

/** A trophy for the road (steps or a streak) or for something seen in the world. */
export type TrophyId = (typeof TROPHIES)[number]['id'] | WorldEventId | 'hitchcock';
/**
 * What a trophy counts: steps on the road, days in a row with the daily goal reached, one sighting, or the
 * bird species seen perched.
 */
export type TrophyMeasure = (typeof TROPHIES)[number]['measure'] | 'sighting' | 'species';

export interface TrophyProgress {
  readonly id: TrophyId;
  readonly measure: TrophyMeasure;
  /** Steps, or days in a row, the trophy asks for. */
  readonly goal: number;
  /** Counted towards it so far, never more than the goal. */
  readonly done: number;
  readonly won: boolean;
}

export interface TrophyInput {
  readonly totalSteps: number;
  /** Days on the road so far; 0 before the first steps are in. */
  readonly days: number;
  /** The most steps entered for a single day. */
  readonly bestDay: number;
  /** Days in a row with the goal reached: the run going on now and the longest one so far. */
  readonly streak: { readonly current: number; readonly best: number };
}

export function trophyProgress({ totalSteps, days, bestDay, streak }: TrophyInput): TrophyProgress[] {
  const steps = Math.max(0, totalSteps);
  return TROPHIES.map(({ id, measure, goal }) => {
    if (measure === 'steps') return { id, measure, goal, done: Math.min(steps, goal), won: steps >= goal };
    if (measure === 'bestDay')
      return { id, measure, goal, done: Math.min(Math.max(0, bestDay), goal), won: bestDay >= goal };
    if (measure === 'days') return { id, measure, goal, done: Math.min(Math.max(0, days), goal), won: days >= goal };
    // A streak once reached stays won; until then the run going on now is what counts, since a broken
    // run starts again from nothing.
    const won = streak.best >= goal;
    return { id, measure, goal, done: won ? goal : Math.min(streak.current, goal), won };
  });
}

/**
 * The trophies for moments in the world, each won by having seen it once, and "Hitchcock", won once every
 * bird species has perched on the wanderer's pack or tent.
 */
export function worldTrophyProgress(seen: readonly SightingId[]): TrophyProgress[] {
  const events = WORLD_EVENTS.map((id): TrophyProgress => {
    const won = seen.includes(id);
    return { id, measure: 'sighting', goal: 1, done: won ? 1 : 0, won };
  });
  const birds = BIRD_SPECIES.filter((bird) => seen.includes(`bird:${bird}`)).length;
  const hitchcock: TrophyProgress = {
    id: 'hitchcock',
    measure: 'species',
    goal: BIRD_SPECIES.length,
    done: birds,
    won: birds === BIRD_SPECIES.length,
  };
  return [...events, hitchcock];
}
