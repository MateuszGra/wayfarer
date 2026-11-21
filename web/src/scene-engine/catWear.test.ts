import { describe, expect, it } from 'vitest';
import type { Precipitation } from '@shared/weather/weather';
import { catWear } from './catWear';

const weather = (precipitation: Precipitation, storm = false, frost = false) => ({ precipitation, storm, frost });

describe('catWear', () => {
  it.each([
    ['rain', false, true],
    ['heavyRain', false, true],
    ['drizzle', true, true],
    ['drizzle', false, false],
    ['none', false, false],
    ['snow', false, false],
  ] as const)('in %s (storm: %s) puts the cape on: %s', (fall, storm, cape) => {
    expect(catWear(weather(fall, storm)).cape).toBe(cape);
  });

  it('wears the jumper in the frost even when nothing falls', () => {
    expect(catWear(weather('none', false, true))).toEqual({ coat: true, cape: false });
  });

  it('wears the jumper when it snows', () => {
    expect(catWear(weather('heavySnow'))).toEqual({ coat: true, cape: false });
  });

  it('wears both in freezing rain', () => {
    expect(catWear(weather('rain', false, true))).toEqual({ coat: true, cape: true });
  });
});
