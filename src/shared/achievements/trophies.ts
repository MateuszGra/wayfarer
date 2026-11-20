/** Collectible trophies, each won once the player's total steps on the road reach its threshold. */
export const TROPHIES = [
  { id: 'aezakmi', steps: 20_000 },
  { id: 'dragonborn', steps: 70_000 },
  { id: 'kremowka', steps: 213_700 },
  // A "Sasin" is the jokey unit of 70 million zloty spent on the postal election that never happened;
  // the small one here is a hundredth of it, in steps.
  { id: 'postalVote', steps: 700_000 },
  { id: 'ringBearer', steps: 3_800_000 },
  { id: 'forrest', steps: 6_500_000 },
  { id: 'twardowski', steps: 500_000_000 },
] as const;

export type TrophyId = (typeof TROPHIES)[number]['id'];

export interface TrophyProgress {
  readonly id: TrophyId;
  /** Steps the trophy asks for. */
  readonly goal: number;
  /** Steps counted towards it, never more than the goal. */
  readonly done: number;
  readonly won: boolean;
}

export function trophyProgress(totalSteps: number): TrophyProgress[] {
  const steps = Math.max(0, totalSteps);
  return TROPHIES.map(({ id, steps: goal }) => ({ id, goal, done: Math.min(steps, goal), won: steps >= goal }));
}
