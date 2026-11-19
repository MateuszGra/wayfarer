import { describe, expect, it } from 'vitest';
import { beardLength } from './beard.js';

describe('beardLength', () => {
  it('is clean-shaven on the first day', () => {
    expect(beardLength(1)).toBe(0);
  });

  it('is about half grown a month in', () => {
    expect(beardLength(31)).toBeCloseTo(0.508, 3);
  });

  it.each([
    { day: 59, length: 58 / 59 },
    { day: 60, length: 1 },
    { day: 61, length: 1 },
    { day: 400, length: 1 },
  ])('is $length on day $day and never grows past full', ({ day, length }) => {
    expect(beardLength(day)).toBeCloseTo(length, 6);
  });

  it.each([0, -3, 1.5])('throws for day %s', (day) => {
    expect(() => beardLength(day)).toThrow(RangeError);
  });
});
