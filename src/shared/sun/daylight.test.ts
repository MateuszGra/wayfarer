import { describe, expect, it } from 'vitest';
import { daylightOn } from './daylight';

const SLUPSK = { latitude: 54.46, longitude: 17.03 };
const SANTIAGO = { latitude: 42.88, longitude: -8.54 };
const minutes = (hour: number): string =>
  `${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}`;

describe('daylightOn', () => {
  // Checked against Open-Meteo's sunrise and sunset for the same places: within two minutes.
  it.each([
    { place: 'Słupsk', at: SLUPSK, date: '2026-11-20', zone: 'Europe/Warsaw', sunrise: '07:31', sunset: '15:45' },
    { place: 'Słupsk', at: SLUPSK, date: '2026-06-21', zone: 'Europe/Warsaw', sunrise: '04:16', sunset: '21:31' },
    { place: 'Santiago', at: SANTIAGO, date: '2026-11-20', zone: 'Europe/Madrid', sunrise: '08:32', sunset: '18:08' },
  ])('gives sunrise $sunrise and sunset $sunset in $place on $date', ({ at, date, zone, sunrise, sunset }) => {
    const daylight = daylightOn(date, zone, at);

    expect(daylight && [minutes(daylight.sunriseHour), minutes(daylight.sunsetHour)]).toEqual([sunrise, sunset]);
  });

  it('has no sunrise in the polar night', () => {
    expect(daylightOn('2026-12-21', 'Europe/Oslo', { latitude: 78.22, longitude: 15.65 })).toBeNull();
  });
});
