import { describe, expect, it } from 'vitest';
import { weatherOf, windOf } from './weather';

const reading = (code: number, temperatureC = 10, windKmh = 5) => ({ code, temperatureC, windKmh });

describe('weatherOf', () => {
  it.each([
    { code: 0, sky: 'clear', precipitation: 'none' },
    { code: 2, sky: 'partly', precipitation: 'none' },
    { code: 3, sky: 'overcast', precipitation: 'none' },
    { code: 45, sky: 'fog', precipitation: 'none' },
    { code: 53, sky: 'overcast', precipitation: 'drizzle' },
    { code: 63, sky: 'overcast', precipitation: 'rain' },
    { code: 65, sky: 'overcast', precipitation: 'heavyRain' },
    { code: 80, sky: 'partly', precipitation: 'rain' },
    { code: 73, sky: 'overcast', precipitation: 'snow' },
    { code: 75, sky: 'overcast', precipitation: 'heavySnow' },
  ])('turns code $code into a $sky sky with $precipitation falling', ({ code, sky, precipitation }) => {
    expect(weatherOf(reading(code))).toMatchObject({ sky, precipitation, storm: false });
  });

  it.each([95, 96, 99])('adds a storm for code %i', (code) => {
    expect(weatherOf(reading(code)).storm).toBe(true);
  });

  it('shows an unknown code as an overcast, dry sky', () => {
    expect(weatherOf(reading(42))).toMatchObject({ sky: 'overcast', precipitation: 'none', storm: false });
  });

  it('brings frost at exactly −1 °C', () => {
    expect(weatherOf(reading(0, -1)).frost).toBe(true);
  });

  it('has no frost just above −1 °C', () => {
    expect(weatherOf(reading(0, -0.9)).frost).toBe(false);
  });
});

describe('windOf', () => {
  it.each([
    { kmh: 0, wind: 'calm' },
    { kmh: 11.9, wind: 'calm' },
    { kmh: 12, wind: 'breeze' },
    { kmh: 38.9, wind: 'breeze' },
    { kmh: 39, wind: 'strong' },
  ])('calls $kmh km/h $wind', ({ kmh, wind }) => {
    expect(windOf(kmh)).toBe(wind);
  });
});
