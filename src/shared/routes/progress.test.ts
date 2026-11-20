import { describe, expect, it } from 'vitest';
import type { RoutePoint } from '../api/contracts.js';
import { routeProgress, todaySegment } from './progress.js';

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

describe('todaySegment', () => {
  it('runs from where the day started to where today takes the traveller, across a bend', () => {
    // 200 km route over two equal legs: 50 km done before today, 100 km after it.
    expect(todaySegment(PATH, 200, 150, 100)).toEqual([
      [5, 0],
      [10, 0],
      [15, 0],
    ]);
  });

  it('is a single point on a rest day', () => {
    expect(todaySegment(PATH, 200, 50, 0)).toEqual([[5, 0]]);
  });

  it('starts at the beginning on the first day', () => {
    expect(todaySegment(PATH, 200, 50, 50)).toEqual([
      [0, 0],
      [5, 0],
    ]);
  });
});
