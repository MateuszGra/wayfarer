import { describe, expect, it } from 'vitest';
import { cloudBand, cloudGrey, landFog, rainLook } from './weatherLook';

describe('cloudBand', () => {
  it('hangs an overcast sky lower than fair-weather clouds, and bigger', () => {
    expect(cloudBand('overcast')).toEqual({ top: 0.16, spread: 0.2, size: 1.5 });
    expect(cloudBand('partly')).toEqual({ top: 0.1, spread: 0.28, size: 1 });
  });

  it('brings fog cloud lowest of all, down onto the hills', () => {
    expect(cloudBand('fog').top).toBe(0.22);
  });
});

describe('cloudGrey', () => {
  it.each([
    ['clear', false, 0],
    ['partly', false, 0.1],
    ['overcast', false, 0.55],
    ['overcast', true, 0.8],
    ['fog', false, 0.5],
  ] as const)('a %s sky (storm: %s) greys clouds by %s', (sky, storm, grey) => {
    expect(cloudGrey({ sky, storm })).toBe(grey);
  });
});

describe('landFog', () => {
  it.each([
    ['fog', 'none', 1],
    ['fog', 'heavyRain', 1],
    ['overcast', 'heavyRain', 0.35],
    ['overcast', 'rain', 0.15],
    ['overcast', 'drizzle', 0],
    ['clear', 'none', 0],
  ] as const)('a %s sky with %s lays fog of %s over the land', (sky, precipitation, fog) => {
    expect(landFog({ sky, precipitation })).toBe(fog);
  });
});

describe('rainLook', () => {
  it('falls in more, longer and bolder streaks in a downpour than in rain', () => {
    expect(rainLook('rain')).toEqual({ count: 260, length: 0.03, alpha: 0.42, width: 1.1 });
    expect(rainLook('heavyRain')).toEqual({ count: 520, length: 0.042, alpha: 0.5, width: 1.5 });
  });

  it('draws drizzle as a few short faint streaks', () => {
    expect(rainLook('drizzle')).toEqual({ count: 90, length: 0.012, alpha: 0.28, width: 1 });
  });

  it.each(['none', 'snow', 'heavySnow'] as const)('draws no streaks for %s', (precipitation) => {
    expect(rainLook(precipitation)).toBeNull();
  });
});
