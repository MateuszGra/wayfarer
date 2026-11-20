import { describe, expect, it } from 'vitest';
import { distanceKm, walkedShare, walkingWindow } from './dailyWalk.js';

describe('walkingWindow', () => {
  it('returns a rest day when there were no steps', () => {
    expect(walkingWindow(0)).toBeNull();
  });

  it('returns a rest day on screen below 100 steps', () => {
    expect(walkingWindow(99)).toBeNull();
  });

  it.each([
    { steps: 100, endHour: 7 },
    { steps: 714, endHour: 7 },
    { steps: 1_000, endHour: 7.4 },
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

  it.each([
    { steps: 4_000, goal: 8_000, endHour: 13 },
    { steps: 8_000, goal: 8_000, endHour: 20 },
    { steps: 12_000, goal: 8_000, endHour: 20 },
  ])('walks until $endHour with $steps steps towards a goal of $goal', ({ steps, goal, endHour }) => {
    expect(walkingWindow(steps, goal)?.endHour).toBe(endHour);
  });

  it('starts the walk when the steps were entered later in the day, cut short at 20:00', () => {
    expect(walkingWindow(10_000, 10_000, 18)).toEqual({ startHour: 18, endHour: 20 });
  });

  it('walks a short day in full when its steps come in after the time it would have ended', () => {
    expect(walkingWindow(2_000, 10_000, 14)).toEqual({ startHour: 14, endHour: 16.8 });
  });

  it('keeps the 06:00 start for steps entered before it', () => {
    expect(walkingWindow(10_000, 10_000, 5.5)).toEqual({ startHour: 6, endHour: 20 });
  });

  it('walks a small day for an hour from when its steps came in', () => {
    expect(walkingWindow(100, 10_000, 14)).toEqual({ startHour: 14, endHour: 15 });
  });

  it('cuts even the shortest walk at dusk', () => {
    expect(walkingWindow(100, 10_000, 19.5)).toEqual({ startHour: 19.5, endHour: 20 });
  });

  it('still walks steps entered just before 20:00, until 20:00', () => {
    expect(walkingWindow(5_000, 10_000, 19.5)).toEqual({ startHour: 19.5, endHour: 20 });
  });

  it('has nothing left to walk when the steps were entered exactly at 20:00', () => {
    expect(walkingWindow(5_000, 10_000, 20)).toBeNull();
  });

  it('has nothing left to walk when the steps were entered at night', () => {
    expect(walkingWindow(10_000, 10_000, 21)).toBeNull();
  });

  describe('on a short November day in Słupsk (sun 07:30 to 15:45)', () => {
    const november = { sunriseHour: 7.5, sunsetHour: 15.75 };

    it('walks from sunrise until half an hour after sunset on the full goal', () => {
      expect(walkingWindow(10_000, 10_000, 0, november)).toEqual({ startHour: 7.5, endHour: 16.25 });
    });

    it('walks half of that walking day on half the goal', () => {
      expect(walkingWindow(5_000, 10_000, 0, november)).toEqual({ startHour: 7.5, endHour: 11.875 });
    });

    it('still walks steps entered just after sunset, until dusk', () => {
      expect(walkingWindow(10_000, 10_000, 16, november)).toEqual({ startHour: 16, endHour: 16.25 });
    });

    it('has nothing left to walk once dusk has passed', () => {
      expect(walkingWindow(10_000, 10_000, 16.25, november)).toBeNull();
    });
  });

  it.each([0, -1, 2.5])('throws when the goal is %s', (goal) => {
    expect(() => walkingWindow(1_000, goal)).toThrow(RangeError);
  });

  it.each([-1, 1.5, Number.NaN])('throws when the step count is %s', (steps) => {
    expect(() => walkingWindow(steps)).toThrow(RangeError);
  });
});

describe('walkedShare', () => {
  const window = { startHour: 6, endHour: 20 };

  it.each([
    { hour: 5, share: 0 },
    { hour: 6, share: 0 },
    { hour: 13, share: 0.5 },
    { hour: 20, share: 1 },
    { hour: 23, share: 1 },
  ])('has walked $share of the day at $hour', ({ hour, share }) => {
    expect(walkedShare(window, hour)).toBe(share);
  });

  it('counts the whole day as walked when there was nothing to walk on screen', () => {
    expect(walkedShare(null, 8)).toBe(1);
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
