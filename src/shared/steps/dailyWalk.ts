// Rules from docs/brief.md, "Daily step budget": yesterday's steps decide how long the traveller walks today.

export const WALK_START_HOUR = 6;
export const LATEST_WALK_END_HOUR = 20;
// 10,000 steps is the reference day: it lets the traveller walk from 06:00 until 20:00.
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
 * Returns null for a rest day (no steps): the traveller stays at camp.
 * The mapping is linear up to the reference day and capped at sunset; the brief keeps the exact curve
 * as an open question, so this is the place to change it.
 */
export function walkingWindow(steps: number): WalkingWindow | null {
  assertStepCount(steps);
  if (steps === 0) return null;
  const share = Math.min(steps, FULL_DAY_STEPS) / FULL_DAY_STEPS;
  return { startHour: WALK_START_HOUR, endHour: WALK_START_HOUR + (LATEST_WALK_END_HOUR - WALK_START_HOUR) * share };
}

export function distanceKm(steps: number, strideMetres: number = DEFAULT_STRIDE_METRES): number {
  assertStepCount(steps);
  if (!(strideMetres > 0)) throw new RangeError(`Stride must be positive, got ${strideMetres}`);
  return (steps * strideMetres) / 1000;
}
