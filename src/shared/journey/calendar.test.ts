import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, isTimeZone, localDate, localHour } from './calendar';

describe('localDate', () => {
  it('gives the date in the player time zone, not the server one', () => {
    // 23:30 UTC on 19 November is already 00:30 on 20 November in Warsaw.
    expect(localDate(new Date('2026-11-19T23:30:00Z'), 'Europe/Warsaw')).toBe('2026-11-20');
  });

  it('keeps the previous date one second before local midnight', () => {
    expect(localDate(new Date('2026-11-19T22:59:59Z'), 'Europe/Warsaw')).toBe('2026-11-19');
  });
});

describe('localHour', () => {
  it('gives the local time of day in hours', () => {
    expect(localHour(new Date('2026-11-20T13:30:00Z'), 'Europe/Warsaw')).toBe(14.5);
  });
});

describe('isTimeZone', () => {
  it('accepts a known time zone', () => {
    expect(isTimeZone('Europe/Warsaw')).toBe(true);
  });

  it('rejects an unknown one', () => {
    expect(isTimeZone('Mars/Olympus')).toBe(false);
  });
});

describe('addDays and daysBetween', () => {
  it('steps over the end of a month', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  });

  it('steps back over the start of a year', () => {
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('counts whole days across the switch from summer time', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });

  it('counts backwards as negative', () => {
    expect(daysBetween('2026-11-20', '2026-11-18')).toBe(-2);
  });
});
