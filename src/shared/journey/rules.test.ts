import { describe, expect, it } from 'vitest';
import { isDailyGoal, isDayOfSteps } from './rules';

describe('isDailyGoal', () => {
  it.each([3_000, 10_000, 25_000])('accepts %i steps', (steps) => {
    expect(isDailyGoal(steps)).toBe(true);
  });

  it.each([2_500, 25_500, 10_250, 0])('refuses %i steps', (steps) => {
    expect(isDailyGoal(steps)).toBe(false);
  });
});

describe('isDayOfSteps', () => {
  it.each([0, 1, 50_000])('accepts %i steps', (steps) => {
    expect(isDayOfSteps(steps)).toBe(true);
  });

  it.each([-1, 50_001, 1.5, Number.NaN])('refuses %s steps', (steps) => {
    expect(isDayOfSteps(steps)).toBe(false);
  });
});
