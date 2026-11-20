import { describe, expect, it } from 'vitest';
import { TRAILS } from './splashArt';

describe('splash art', () => {
  it('sends three people out of the splash, four steps each', () => {
    expect(TRAILS.map((trail) => trail.length)).toEqual([4, 4, 4]);
  });

  it('spreads the walkers a third of a turn apart', () => {
    expect(TRAILS.map((trail) => trail[0]?.[2])).toEqual([30, 150, 270]);
  });

  it('alternates left and right feet, starting with the left', () => {
    expect(TRAILS[0]?.map(([, , , scale]) => Math.sign(scale))).toEqual([-1, 1, -1, 1]);
  });
});
