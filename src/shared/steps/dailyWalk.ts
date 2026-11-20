// Rules from docs/brief.md, "Daily step budget": yesterday's steps decide how long the traveller walks today.

export const WALK_START_HOUR = 6;
export const LATEST_WALK_END_HOUR = 20;
// The reference day when no goal is given: 10,000 steps let the traveller walk from 06:00 until 20:00.
export const FULL_DAY_STEPS = 10_000;
// Average adult walking stride; refined later per player (height or tracker distance).
export const DEFAULT_STRIDE_METRES = 0.75;

export interface WalkingWindow {
  readonly startHour: number;
  readonly endHour: number;
}

function assertStepCount(steps: number): void {
  if (!Number.isInteger(steps) || steps < 0) {
    throw new RangeError(`Step count must be a non-negative integer, got ${steps}`);
  }
}

/**
 * When the traveller walks today on yesterday's `steps`. Reaching the player's daily `goal` fills the whole
 * day, 06:00 to 20:00; fewer steps end the walk earlier, linearly (the brief keeps the exact curve open, so
 * this is the place to change it); more steps don't walk past sunset, they only make the pace quicker.
 * Steps entered later in the day (`enteredAtHour`) start the walk then, and it lasts as long as the steps
 * allow but never past 20:00: 5,000 steps entered at 14:00 walk until 20:00, entered at 18:00 only until
 * 20:00 too. Returns null when there is nothing to walk on screen: a rest day, or steps entered after
 * 20:00 (they still count towards the distance).
 */
export function walkingWindow(steps: number, goal: number = FULL_DAY_STEPS, enteredAtHour = 0): WalkingWindow | null {
  assertStepCount(steps);
  if (!Number.isInteger(goal) || goal <= 0) throw new RangeError(`Daily goal must be a positive integer, got ${goal}`);
  if (steps === 0) return null;
  const hours = (LATEST_WALK_END_HOUR - WALK_START_HOUR) * (Math.min(steps, goal) / goal);
  const startHour = Math.max(WALK_START_HOUR, enteredAtHour);
  const endHour = Math.min(LATEST_WALK_END_HOUR, startHour + hours);
  return startHour < endHour ? { startHour, endHour } : null;
}

/** How much of today's walk is behind the traveller at `hour`, 0..1. */
export function walkedShare(window: WalkingWindow | null, hour: number): number {
  if (!window) return 1;
  return Math.min(1, Math.max(0, (hour - window.startHour) / (window.endHour - window.startHour)));
}

export function distanceKm(steps: number, strideMetres: number = DEFAULT_STRIDE_METRES): number {
  assertStepCount(steps);
  if (!(strideMetres > 0)) throw new RangeError(`Stride must be positive, got ${strideMetres}`);
  return (steps * strideMetres) / 1000;
}
