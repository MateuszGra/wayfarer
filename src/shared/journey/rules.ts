/** The daily step goal a player can plan with. */
export const DAILY_GOAL = { min: 3_000, max: 25_000, step: 500 } as const;

// A day's steps above this are almost certainly a typo, so the game asks before saving them; above the
// hard limit nobody walks in a day, so they are refused.
export const CONFIRM_STEPS_ABOVE = 30_000;
export const MAX_DAILY_STEPS = 50_000;

export function isDailyGoal(steps: number): boolean {
  return Number.isInteger(steps) && steps >= DAILY_GOAL.min && steps <= DAILY_GOAL.max && steps % DAILY_GOAL.step === 0;
}

export function isDayOfSteps(steps: number): boolean {
  return Number.isInteger(steps) && steps >= 0 && steps <= MAX_DAILY_STEPS;
}
