import { describe, expect, it } from 'vitest';
import { FIRESIDE_STRETCH_S, pipeAt } from './fireside';

// Mid-stretch values of the first `stretches` stretches.
const habits = (stretches: number) =>
  Array.from({ length: stretches }, (_, n) => pipeAt(n * FIRESIDE_STRETCH_S + FIRESIDE_STRETCH_S / 2));

describe('pipeAt', () => {
  it('has either the pipe or the mug in hand in the middle of a stretch', () => {
    expect(new Set(habits(20))).toEqual(new Set([0, 1]));
  });

  it('picks the pipe some stretches and the tea others, not in a fixed turn', () => {
    expect(habits(12)).not.toEqual([1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]);
    expect(habits(12)).not.toEqual([0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1]);
  });

  it.each([1, 2, 3, 4, 5])('swaps without a jump at the start of stretch %s', (stretch) => {
    const boundary = stretch * FIRESIDE_STRETCH_S;

    expect(pipeAt(boundary)).toBeCloseTo(pipeAt(boundary - 0.001), 2);
  });

  it('keeps to one thing for the whole of a stretch once the swap is done', () => {
    expect(pipeAt(3 * FIRESIDE_STRETCH_S + 1)).toBe(pipeAt(3 * FIRESIDE_STRETCH_S + 29));
  });

  it('gives the same thing for the same moment', () => {
    expect(pipeAt(123.4)).toBe(pipeAt(123.4));
  });
});
