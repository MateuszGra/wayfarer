import type { Weather } from '@shared/weather/weather';

/** Where clouds hang, as fractions of the screen height from the top: from `top` to `top + spread`. */
export interface CloudBand {
  readonly top: number;
  readonly spread: number;
  /** Width multiplier: a heavy sky is a deck of big clouds, not scattered puffs. */
  readonly size: number;
}

/** Rain streaks: how many at once, their length as a fraction of the screen height, opacity and width. */
export interface RainLook {
  readonly count: number;
  readonly length: number;
  readonly alpha: number;
  readonly width: number;
}

type Rain = 'drizzle' | 'rain' | 'heavyRain';

// Fair-weather cumulus floats high; an overcast deck hangs lower and heavier, and in fog the cloud
// sits on the hills.
const CLOUD_BANDS: Record<Weather['sky'], CloudBand> = {
  clear: { top: 0.1, spread: 0.28, size: 1 },
  partly: { top: 0.1, spread: 0.28, size: 1 },
  overcast: { top: 0.16, spread: 0.2, size: 1.5 },
  fog: { top: 0.22, spread: 0.14, size: 1.6 },
};

const RAIN: Record<Rain, RainLook> = {
  drizzle: { count: 90, length: 0.012, alpha: 0.28, width: 1 },
  rain: { count: 260, length: 0.03, alpha: 0.42, width: 1.1 },
  heavyRain: { count: 520, length: 0.042, alpha: 0.5, width: 1.5 },
};

export function cloudBand(sky: Weather['sky']): CloudBand {
  return CLOUD_BANDS[sky];
}

/**
 * How far clouds are pulled towards a flat rain grey, 0 to 1: not at all in a clear sky, most of the way
 * when overcast, darker still in a storm.
 */
export function cloudGrey(weather: Pick<Weather, 'sky' | 'storm'>): number {
  const bySky = { clear: 0, partly: 0.1, overcast: 0.55, fog: 0.5 }[weather.sky];
  return Math.min(1, bySky + (weather.storm ? 0.25 : 0));
}

/**
 * How thick the fog over the land is, 0 to 1. Fog weather fills the valleys; heavy rain veils the
 * distance; otherwise the land keeps only the biome's own morning mist.
 */
export function landFog(weather: Pick<Weather, 'sky' | 'precipitation'>): number {
  if (weather.sky === 'fog') return 1;
  if (weather.precipitation === 'heavyRain') return 0.35;
  if (weather.precipitation === 'rain') return 0.15;
  return 0;
}

/** The streaks of falling rain, or null when no rain falls. */
export function rainLook(precipitation: Weather['precipitation']): RainLook | null {
  return precipitation === 'drizzle' || precipitation === 'rain' || precipitation === 'heavyRain'
    ? RAIN[precipitation]
    : null;
}
