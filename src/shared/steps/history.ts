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
