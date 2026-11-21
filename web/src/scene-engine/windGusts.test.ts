import { describe, expect, it } from 'vitest';
import { gustAt, gustDebris } from './windGusts';

// Counts the gusts that start within the first `seconds` of the clock, sampled every tenth of a second.
const gustsIn = (wind: 'calm' | 'breeze' | 'strong', seconds: number): number => {
  const seeds = new Set<number>();
  for (let t = 0; t < seconds; t += 0.1) {
    const gust = gustAt(t, wind);
    if (gust) seeds.add(gust.seed);
  }
  return seeds.size;
};

describe('gustAt', () => {
  it('sends no gusts in calm air', () => {
    expect(gustsIn('calm', 160)).toBe(0);
  });

  it('sends a gust in every 4.5 s stretch of a gale', () => {
    expect(gustsIn('strong', 45)).toBe(10);
  });

  it('sends a breeze gust only once in every 16 s', () => {
    expect(gustsIn('breeze', 160)).toBe(10);
  });

  it('makes breeze gusts fainter than a gale’s', () => {
    const breeze = Array.from({ length: 160 }, (_, i) => gustAt(i, 'breeze')).find(Boolean);

    expect(breeze?.strength).toBe(0.45);
  });

  it('carries a gust across the screen from 0 to just under 1', () => {
    const progress = Array.from({ length: 450 }, (_, i) => gustAt(i / 10, 'strong')?.progress).filter(
      (p): p is number => p !== undefined,
    );

    expect(Math.min(...progress)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...progress)).toBeLessThan(1);
  });

  it('ends a slowed-down gale gust before the next stretch, instead of cutting it off', () => {
    const lastMoment = gustAt(4.49, 'strong', 6);

    expect(lastMoment?.progress).toBeGreaterThan(0.99);
  });

  it('gives the same gust for the same moment', () => {
    expect(gustAt(12.3, 'strong')).toEqual(gustAt(12.3, 'strong'));
  });
});

describe('gustDebris', () => {
  it.each([
    ['meseta', 'none', 'dust'],
    ['baltic', 'rain', 'sand'],
    ['forest', 'none', 'leaves'],
    ['fields', 'drizzle', 'leaves'],
    ['mountains', 'snow', 'snow'],
    ['meseta', 'heavySnow', 'snow'],
  ] as const)('in %s with %s lifts %s', (biome, precipitation, debris) => {
    expect(gustDebris(biome, precipitation)).toBe(debris);
  });
});
