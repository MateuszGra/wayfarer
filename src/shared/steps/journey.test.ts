import { describe, expect, it } from 'vitest';
import { arrivalDate, journeyDays } from './journey.js';

describe('journeyDays', () => {
  it('takes 427 days to walk 3,200 km at 10,000 steps a day', () => {
    expect(journeyDays(3200, 10_000)).toBe(427);
  });

  it('counts a last, partial day as a whole day', () => {
    expect(journeyDays(7.6, 10_000)).toBe(2);
  });

  it('takes exactly one day when the route equals one day of walking', () => {
    expect(journeyDays(7.5, 10_000)).toBe(1);
  });

  it('uses the player stride when given', () => {
    expect(journeyDays(80, 10_000, 0.8)).toBe(10);
  });

  it.each([0, -5])('throws for a route of %s km', (lengthKm) => {
    expect(() => journeyDays(lengthKm, 10_000)).toThrow(RangeError);
  });

  it.each([0, -1, 2.5])('throws for %s daily steps', (steps) => {
    expect(() => journeyDays(100, steps)).toThrow(RangeError);
  });
});

describe('arrivalDate', () => {
  it('arrives on the start day for a one-day journey', () => {
    expect(arrivalDate(new Date(2026, 10, 20, 18, 30), 1)).toEqual(new Date(2026, 10, 20));
  });

  it('crosses months and years', () => {
    expect(arrivalDate(new Date(2026, 10, 20), 427)).toEqual(new Date(2028, 0, 20));
  });
});
