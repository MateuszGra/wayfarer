import { describe, expect, it } from 'vitest';
import { Journey } from './journey';

// Warsaw is UTC+1 in November: 07:00 UTC is 08:00 there.
const at = (iso: string) => new Date(iso);
const journey = () => Journey.create('j1', 'a1', 'baltic-santiago', 10_000, 'Europe/Warsaw');

describe('Journey', () => {
  it('starts day 1 on the day the first steps are entered', () => {
    const j = journey();

    j.recordYesterday(8_000, at('2026-11-20T07:00:00Z'));

    expect(j.snapshot().startedOn).toBe('2026-11-20');
  });

  it('records the steps for the day before, in the player time zone', () => {
    const j = journey();

    // 23:30 UTC on the 19th is already the 20th in Warsaw, so "yesterday" is the 19th.
    const entry = j.recordYesterday(8_000, at('2026-11-19T23:30:00Z'));

    expect(entry).toEqual({ date: '2026-11-19', steps: 8_000, enteredAtHour: 0.5 });
  });

  it('corrects yesterday on the same day, keeping the hour of the first entry', () => {
    const j = journey();
    j.recordYesterday(8_000, at('2026-11-20T07:00:00Z'));

    const corrected = j.recordYesterday(9_000, at('2026-11-20T15:00:00Z'));

    expect(corrected).toEqual({ date: '2026-11-19', steps: 9_000, enteredAtHour: 8 });
    expect(j.snapshot().entries).toHaveLength(1);
  });

  it('asks about the next day once midnight has passed, leaving the earlier entry as it was', () => {
    const j = journey();
    j.recordYesterday(8_000, at('2026-11-20T07:00:00Z'));

    j.recordYesterday(5_000, at('2026-11-21T07:00:00Z'));

    expect(j.snapshot().entries.map((e) => [e.date, e.steps])).toEqual([
      ['2026-11-19', 8_000],
      ['2026-11-20', 5_000],
    ]);
  });

  it.each([-1, 50_001, 2.5])('refuses %s steps', (steps) => {
    expect(() => journey().recordYesterday(steps, at('2026-11-20T07:00:00Z'))).toThrow(
      expect.objectContaining({ code: 'invalid_steps' }),
    );
  });

  it('accepts exactly 50 000 steps', () => {
    expect(journey().recordYesterday(50_000, at('2026-11-20T07:00:00Z')).steps).toBe(50_000);
  });

  it('refuses a goal outside the planner range', () => {
    expect(() => Journey.create('j1', 'a1', 'baltic-santiago', 2_500, 'Europe/Warsaw')).toThrow(
      expect.objectContaining({ code: 'validation_failed' }),
    );
  });

  it('refuses an unknown time zone', () => {
    expect(() => Journey.create('j1', 'a1', 'baltic-santiago', 10_000, 'Mars/Olympus')).toThrow(
      expect.objectContaining({ code: 'validation_failed' }),
    );
  });

  it('counts today steps as walked the moment they are entered', () => {
    const j = journey();
    j.recordYesterday(10_000, at('2026-11-20T05:00:00Z'));

    expect(j.kmWalked(at('2026-11-20T05:00:01Z'))).toBe(7.5);
  });

  it('keeps the distance on a new route counted from the moment the route changed', () => {
    const j = journey();
    j.recordYesterday(10_000, at('2026-11-20T05:00:00Z'));

    j.changePlan('via-francigena', 12_000, at('2026-11-20T12:00:00Z'));

    expect(j.snapshot()).toMatchObject({ routeId: 'via-francigena', dailySteps: 12_000, routeSinceKm: 7.5 });
  });

  it('keeps the route offset when only the goal changes', () => {
    const j = journey();
    j.recordYesterday(10_000, at('2026-11-20T05:00:00Z'));

    j.changePlan('baltic-santiago', 12_000, at('2026-11-20T12:00:00Z'));

    expect(j.snapshot().routeSinceKm).toBe(0);
  });
});
