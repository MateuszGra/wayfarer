import { describe, expect, it } from 'vitest';
import type { Precipitation } from '@shared/weather/weather';
import { catWear } from './catWear';

const weather = (precipitation: Precipitation, frost = false) => ({ precipitation, frost });

describe('catWear', () => {
  it.each([
    ['rain', true],
    ['heavyRain', true],
    ['drizzle', false],
    ['none', false],
    ['snow', false],
  ] as const)('in %s puts the cape on: %s', (fall, cape) => {
    expect(catWear(weather(fall)).cape).toBe(cape);
  });

  it('wears the jumper in the frost even when nothing falls', () => {
    expect(catWear(weather('none', true))).toEqual({ coat: true, cape: false });
  });

  it('wears the jumper when it snows', () => {
    expect(catWear(weather('heavySnow'))).toEqual({ coat: true, cape: false });
  });

  it('wears both in freezing rain', () => {
    expect(catWear(weather('rain', true))).toEqual({ coat: true, cape: true });
  });
});
