import { describe, expect, it } from 'vitest';
import { pitchHour, seatOut, tentUp } from './campSchedule';

// A short morning walk: 1237 steps of a 10 000 goal, scene hours.
const SHORT = { startHour: 6.2, endHour: 7.4 };
const FULL_DAY = { startHour: 6.2, endHour: 19.3 };

describe('camp schedule', () => {
  it('pitches camp as soon as a short walk ends', () => {
    expect(pitchHour(SHORT)).toBe(7.4);
  });

  it('pitches camp at dusk after a full day on the road', () => {
    expect(pitchHour(FULL_DAY)).toBe(19.3);
  });

  it('never pitches camp later than dusk, even when the walk runs past it', () => {
    expect(pitchHour({ startHour: 6.2, endHour: 19.8 })).toBe(19.3);
  });

  // Regression: he used to sit on the bare road, with no stump or tent, from a short walk's end until dusk.
  it('has the stump out and the tent up through the day after a short walk', () => {
    expect(seatOut(10, SHORT)).toBe(true);
    expect(tentUp(10, SHORT)).toBe(true);
  });

  it('takes the stump out before the tent stands', () => {
    expect([seatOut(7.7, SHORT), tentUp(7.7, SHORT)]).toEqual([true, false]);
  });

  it('keeps the road clear while he walks', () => {
    expect([seatOut(12, FULL_DAY), tentUp(12, FULL_DAY)]).toEqual([false, false]);
  });

  it('keeps the camp all day when there is no walk', () => {
    expect([seatOut(12, null), tentUp(12, null)]).toEqual([true, true]);
  });

  it('keeps the camp at night until he packs it in the morning', () => {
    expect([tentUp(3, FULL_DAY), tentUp(6.1, FULL_DAY)]).toEqual([true, false]);
  });
});
