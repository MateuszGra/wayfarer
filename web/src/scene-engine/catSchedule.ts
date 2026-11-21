/** Seconds of the animation clock: a ride on the backpack once every `period`, from `from` to `to`; each leap takes `leap`. */
export const CAT_RIDE = { period: 240, from: 150, to: 205, leap: 0.7 } as const;
/** Seconds of the animation clock: a pause to wash a paw once every `period`, from `from` to `to`. */
export const CAT_WASH = { period: 75, from: 30, to: 37 } as const;

/** Whether any ride on the backpack overlaps the stretch of the clock from `a` to `b`. */
export function catRideOverlaps(a: number, b: number): boolean {
  for (let k = Math.floor(a / CAT_RIDE.period) - 1; k <= Math.floor(b / CAT_RIDE.period) + 1; k++) {
    const rideStart = k * CAT_RIDE.period + CAT_RIDE.from;
    const rideEnd = k * CAT_RIDE.period + CAT_RIDE.to;
    if (rideStart < b && rideEnd > a) return true;
  }
  return false;
}

/**
 * Whether the paw wash of the cycle around `t` is left out because it would fall during a ride: the
 * cat can't sit down to wash on the road while it is up on the backpack.
 */
export function catWashSkipped(t: number): boolean {
  const cycleStart = Math.floor(t / CAT_WASH.period) * CAT_WASH.period;
  return catRideOverlaps(cycleStart + CAT_WASH.from, cycleStart + CAT_WASH.to);
}
