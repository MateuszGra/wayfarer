import { describe, expect, it } from 'vitest';
import { distanceKm, walkingWindow } from './dailyWalk.js';

describe('walkingWindow', () => {
  it('returns a rest day when there were no steps', () => {
    expect(walkingWindow(0)).toBeNull();
  });

  it.each([
    { steps: 1, endHour: 6.0014 },
    { steps: 5_000, endHour: 13 },
    { steps: 9_999, endHour: 19.9986 },
    { steps: 10_000, endHour: 20 },
    { steps: 10_001, endHour: 20 },
    { steps: 25_000, endHour: 20 },
  ])('walks from 06:00 until $endHour with $steps steps', ({ steps, endHour }) => {
    const window = walkingWindow(steps);

    expect(window?.startHour).toBe(6);
    expect(window?.endHour).toBeCloseTo(endHour, 4);
  });

  it.each([-1, 1.5, Number.NaN])('throws when the step count is %s', (steps) => {
    expect(() => walkingWindow(steps)).toThrow(RangeError);
  });
});

describe('distanceKm', () => {
  it('covers 7.5 km for 10,000 steps with the default stride', () => {
    expect(distanceKm(10_000)).toBe(7.5);
  });

  it('covers no distance without steps', () => {
    expect(distanceKm(0)).toBe(0);
  });

  it('uses the player stride when given', () => {
    expect(distanceKm(2_000, 0.8)).toBe(1.6);
  });

  it.each([0, -0.5])('throws when the stride is %s', (stride) => {
    expect(() => distanceKm(1_000, stride)).toThrow(RangeError);
  });
});
