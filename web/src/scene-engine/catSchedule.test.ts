import { describe, expect, it } from 'vitest';
import { catRideOverlaps, catWashSkipped } from './catSchedule';

// Rides run from 150 s to 205 s of every 240 s; paw washes from 30 s to 37 s of every 75 s.
describe('catRideOverlaps', () => {
  it.each([
    [149, 151, true],
    [160, 170, true],
    [390, 400, true],
    [140, 150, false],
    [205, 215, false],
    [30, 37, false],
  ])('from %s s to %s s: %s', (a, b, overlaps) => {
    expect(catRideOverlaps(a, b)).toBe(overlaps);
  });
});

describe('catWashSkipped', () => {
  it('leaves out the paw wash that would fall during a ride', () => {
    expect(catWashSkipped(183)).toBe(true);
  });

  it('leaves out the paw wash during the next ride too', () => {
    expect(catWashSkipped(408)).toBe(true);
  });

  it('keeps a paw wash away from any ride', () => {
    expect(catWashSkipped(33)).toBe(false);
  });

  it('keeps the paw wash of the cycle just before a ride', () => {
    expect(catWashSkipped(108)).toBe(false);
  });
});
