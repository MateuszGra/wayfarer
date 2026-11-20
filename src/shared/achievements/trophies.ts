/**
 * Collectible trophies. Most are won once the player's total steps on the road reach their threshold; a
 * streak trophy is won by reaching the daily goal on a number of days in a row.
 */
export const TROPHIES = [
  { id: 'aezakmi', measure: 'steps', goal: 20_000 },
  { id: 'dragonborn', measure: 'steps', goal: 70_000 },
  { id: 'tenOutOfTen', measure: 'streak', goal: 10 },
  { id: 'kremowka', measure: 'steps', goal: 213_700 },
  // A "Sasin" is the jokey unit of 70 million zloty spent on the postal election that never happened;
  // the small one here is a hundredth of it, in steps.
  { id: 'postalVote', measure: 'steps', goal: 700_000 },
  { id: 'ringBearer', measure: 'steps', goal: 3_800_000 },
  { id: 'forrest', measure: 'steps', goal: 6_500_000 },
  { id: 'twardowski', measure: 'steps', goal: 500_000_000 },
] as const;

export type TrophyId = (typeof TROPHIES)[number]['id'];
/** What a trophy counts: steps on the road, or days in a row with the daily goal reached. */
export type TrophyMeasure = (typeof TROPHIES)[number]['measure'];

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
  /** Days in a row with the goal reached: the run going on now and the longest one so far. */
  readonly streak: { readonly current: number; readonly best: number };
}

export function trophyProgress({ totalSteps, streak }: TrophyInput): TrophyProgress[] {
  const steps = Math.max(0, totalSteps);
  return TROPHIES.map(({ id, measure, goal }) => {
    if (measure === 'steps') return { id, measure, goal, done: Math.min(steps, goal), won: steps >= goal };
    // A streak once reached stays won; until then the run going on now is what counts, since a broken
    // run starts again from nothing.
    const won = streak.best >= goal;
    return { id, measure, goal, done: won ? goal : Math.min(streak.current, goal), won };
  });
}
