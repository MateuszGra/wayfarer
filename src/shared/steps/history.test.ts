import { describe, expect, it } from 'vitest';
import { dayOutcome, summarize, type DaySteps } from './history.js';

describe('dayOutcome', () => {
  it.each([
    { steps: 9_999, outcome: 'missed' },
    { steps: 10_000, outcome: 'reached' },
    { steps: 10_001, outcome: 'reached' },
    { steps: 1, outcome: 'missed' },
    { steps: 0, outcome: 'rest' },
  ])('is $outcome with $steps steps against a goal of 10,000', ({ steps, outcome }) => {
    expect(dayOutcome(steps, 10_000)).toBe(outcome);
  });
});

describe('summarize', () => {
  const history: DaySteps[] = [
    { day: 1, date: '2026-11-08', steps: 12_000 },
    { day: 2, date: '2026-11-09', steps: 0 },
    { day: 3, date: '2026-11-10', steps: 8_000 },
  ];

  it('counts the days, the goals reached and the steps', () => {
    expect(summarize(history, 10_000)).toEqual({ days: 3, goalsReached: 1, totalSteps: 20_000, totalKm: 15 });
  });

  it('is empty before the first day', () => {
    expect(summarize([], 10_000)).toEqual({ days: 0, goalsReached: 0, totalSteps: 0, totalKm: 0 });
  });
});
