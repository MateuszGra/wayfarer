// The wanderer sets off clean-shaven; his beard grows with every day on the road until it is full.
export const FULL_BEARD_DAYS = 60;

/** Beard length from 0 (clean-shaven) to 1 (full) for the given day on the road, counting from day 1. */
export function beardLength(dayOnRoad: number): number {
  if (!Number.isInteger(dayOnRoad) || dayOnRoad < 1) {
    throw new RangeError(`Day on the road must be a positive integer, got ${dayOnRoad}`);
  }
  return Math.min(1, (dayOnRoad - 1) / (FULL_BEARD_DAYS - 1));
}
