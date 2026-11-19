import { describe, expect, it } from 'vitest';
import type { RoutePoint } from '../api/contracts.js';
import { routeProgress } from './progress.js';

// Two equal legs along the equator, so the drawn path splits evenly in degrees.
const PATH: readonly RoutePoint[] = [
  [0, 0],
  [10, 0],
  [20, 0],
];

describe('routeProgress', () => {
  it('stands at the start before any walking', () => {
    const progress = routeProgress(PATH, 1000, 0);

    expect(progress.position).toEqual([0, 0]);
    expect(progress.walked).toEqual([[0, 0]]);
    expect(progress.remaining).toEqual([
      [0, 0],
      [10, 0],
      [20, 0],
    ]);
    expect(progress.fraction).toBe(0);
  });

  it('is halfway along the drawn path after half the route length', () => {
    const progress = routeProgress(PATH, 1000, 500);

    expect(progress.position[0]).toBeCloseTo(10, 6);
    expect(progress.fraction).toBe(0.5);
  });

  it('splits a leg in the middle of it', () => {
    const progress = routeProgress(PATH, 1000, 250);

    expect(progress.position[0]).toBeCloseTo(5, 6);
    expect(progress.walked).toHaveLength(2);
    expect(progress.remaining.slice(1)).toEqual([
      [10, 0],
      [20, 0],
    ]);
  });

  it('stands at the end once the whole route is walked', () => {
    const progress = routeProgress(PATH, 1000, 1000);

    expect(progress.position).toEqual([20, 0]);
    expect(progress.remaining).toEqual([[20, 0]]);
    expect(progress.fraction).toBe(1);
  });

  it('stays at the end when more than the route length was walked', () => {
    expect(routeProgress(PATH, 1000, 1500).position).toEqual([20, 0]);
  });

  it('throws for a negative distance', () => {
    expect(() => routeProgress(PATH, 1000, -1)).toThrow(RangeError);
  });

  it('throws for a path with a single point', () => {
    expect(() => routeProgress([[0, 0]], 1000, 0)).toThrow(RangeError);
  });
});
