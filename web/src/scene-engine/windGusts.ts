import type { Precipitation, Wind } from '@shared/weather/weather';

/** A gust in progress: how far across the screen it has got (0 to 1), how strong it is and its own seed. */
export interface Gust {
  readonly progress: number;
  readonly strength: number;
  readonly seed: number;
}

/** What a gust carries along: leaves, dust off a dry plain, sand off the beach, or snow. */
export type GustDebris = 'leaves' | 'dust' | 'sand' | 'snow';

interface GustRhythm {
  /** One gust in every stretch of this many seconds, at a moment picked per stretch. */
  readonly every: number;
  readonly strength: number;
}

// A gale sends a gust every few seconds; an ordinary breeze only now and then, and faintly; calm air none.
const RHYTHM: Record<Wind, GustRhythm | null> = {
  calm: null,
  breeze: { every: 16, strength: 0.45 },
  strong: { every: 4.5, strength: 1 },
};

/** Seconds a gust takes to cross a 16:9 screen; the scene shortens it for narrower ones. */
export const GUST_SECONDS = 4;

// A cheap, stable hash of a whole number to 0..1, so each stretch picks the same moment every time.
const pick = (n: number, salt: number): number => {
  const x = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * The gust crossing the screen at second `t` of the animation clock, or null between gusts. Each stretch
 * of the rhythm holds one gust that starts somewhere in its first part, so they come unevenly.
 */
export function gustAt(t: number, wind: Wind, seconds = GUST_SECONDS): Gust | null {
  const rhythm = RHYTHM[wind];
  if (!rhythm) return null;
  // A gust never outlasts its stretch: slowed down, it would otherwise be cut off when the next began.
  const length = Math.min(seconds, rhythm.every);
  const stretch = Math.floor(t / rhythm.every);
  const start = stretch * rhythm.every + pick(stretch, 1) * (rhythm.every - length);
  const progress = (t - start) / length;
  if (progress < 0 || progress >= 1) return null;
  return { progress, strength: rhythm.strength, seed: stretch };
}

/** What the wind lifts in this biome and weather; falling snow is what whirls in any biome. */
export function gustDebris(biome: string, precipitation: Precipitation): GustDebris {
  if (precipitation === 'snow' || precipitation === 'heavySnow') return 'snow';
  if (biome === 'meseta') return 'dust';
  if (biome === 'baltic') return 'sand';
  return 'leaves';
}
