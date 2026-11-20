import { distanceKm } from './dailyWalk.js';

export interface DaySteps {
  /** Day on the road, counting from 1. */
  readonly day: number;
  /** Calendar date of the day, `YYYY-MM-DD`. */
  readonly date: string;
  readonly steps: number;
}

export type DayOutcome = 'reached' | 'missed' | 'rest';

/** A day with no steps at all is a rest day, not a missed goal: the game never punishes resting. */
export function dayOutcome(steps: number, goal: number): DayOutcome {
  if (steps === 0) return 'rest';
  return steps >= goal ? 'reached' : 'missed';
}

export interface HistorySummary {
  readonly days: number;
  readonly goalsReached: number;
  readonly totalSteps: number;
  readonly totalKm: number;
}

export function summarize(history: readonly DaySteps[], goal: number): HistorySummary {
  const totalSteps = history.reduce((sum, day) => sum + day.steps, 0);
  return {
    days: history.length,
    goalsReached: history.filter((day) => dayOutcome(day.steps, goal) === 'reached').length,
    totalSteps,
    totalKm: distanceKm(totalSteps),
  };
}

export interface GoalStreak {
  /** Days in a row ending with the latest day on record on which the goal was reached. */
  readonly current: number;
  /** The longest such run so far. */
  readonly best: number;
}

/**
 * Runs of days on which the goal was reached. A run means days in a row, so a rest day ends it as a missed
 * goal does; the latest day still waiting for its steps doesn't, as it isn't on record yet.
 */
export function goalStreak(history: readonly DaySteps[], goal: number): GoalStreak {
  let current = 0;
  let best = 0;
  for (const day of history) {
    current = dayOutcome(day.steps, goal) === 'reached' ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return { current, best };
}
