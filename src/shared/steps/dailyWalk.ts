import type { Daylight } from '../sun/daylight.js';

// Rules from docs/brief.md, "Daily step budget": yesterday's steps decide how long the traveller walks today.

// He walks by day: from sunrise until half an hour after sunset at the latest, so he reaches camp at dusk.
export const DUSK_MARGIN_HOURS = 0.5;
// The day assumed when the sun's times are unknown (beyond the polar circles): 06:00 to 20:00 on the road.
export const DEFAULT_DAYLIGHT: Daylight = { sunriseHour: 6, sunsetHour: 20 - DUSK_MARGIN_HOURS };
// The reference day when no goal is given.
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
 * When the traveller walks today on yesterday's `steps`, within today's `daylight`. Reaching the player's
 * daily `goal` fills the whole walking day, from sunrise to half an hour after sunset; fewer steps end the
 * walk earlier, linearly (the brief keeps the exact curve open, so this is the place to change it); more
 * steps don't walk into the night, they only make the pace quicker. Steps entered later in the day
 * (`enteredAtHour`) start the walk then, and it lasts as long as the steps allow but never past the walking
 * day's end. Returns null when there is nothing to walk on screen: a rest day, or steps entered after the
 * walking day ended (they still count towards the distance).
 */
export function walkingWindow(
  steps: number,
  goal: number = FULL_DAY_STEPS,
  enteredAtHour = 0,
  daylight: Daylight = DEFAULT_DAYLIGHT,
): WalkingWindow | null {
  assertStepCount(steps);
  if (!Number.isInteger(goal) || goal <= 0) throw new RangeError(`Daily goal must be a positive integer, got ${goal}`);
  if (steps === 0) return null;
  const latestEnd = daylight.sunsetHour + DUSK_MARGIN_HOURS;
  const hours = (latestEnd - daylight.sunriseHour) * (Math.min(steps, goal) / goal);
  const startHour = Math.max(daylight.sunriseHour, enteredAtHour);
  const endHour = Math.min(latestEnd, startHour + hours);
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
