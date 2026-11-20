import { describe, expect, it } from 'vitest';
import { sceneHour } from './sceneClock';

// Słupsk on 20 November: the sun is up from 07:30 to 15:45.
const NOVEMBER = { sunriseHour: 7.5, sunsetHour: 15.75 };

describe('sceneHour', () => {
  it.each([
    { real: 0, scene: 0 },
    { real: 7.5, scene: 6 },
    { real: 15.75, scene: 20 },
    { real: 24, scene: 24 },
  ])('puts real $real at scene hour $scene on a November day', ({ real, scene }) => {
    expect(sceneHour(real, NOVEMBER)).toBe(scene);
  });

  it('stretches the short day evenly between sunrise and sunset', () => {
    expect(sceneHour(11.625, NOVEMBER)).toBe(13);
  });

  it('squeezes the long evening evenly between sunset and midnight', () => {
    expect(sceneHour(19.875, NOVEMBER)).toBe(22);
  });

  it('leaves the hours as they are on a day whose sun matches the scene', () => {
    expect(sceneHour(9.25, { sunriseHour: 6, sunsetHour: 20 })).toBe(9.25);
  });
});
