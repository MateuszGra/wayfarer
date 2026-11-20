import { describe, expect, it } from 'vitest';
import { DEFAULT_DAYLIGHT } from '../steps/dailyWalk';
import { journeyDay, type StepEntry } from './journeyDay';

const GOAL = 10_000;
// A walking day of 06:00 to 20:00; daylight itself is covered by the walking window's tests.
const DAY = DEFAULT_DAYLIGHT;
const entry = (date: string, steps: number, enteredAtHour = 7): StepEntry => ({ date, steps, enteredAtHour });

describe('journeyDay', () => {
  it('asks a new player for yesterday on day 1, with nothing walked yet', () => {
    const today = journeyDay({ startedOn: null, dailyGoal: GOAL, daylight: DAY, entries: [], today: '2026-11-20' });

    expect(today).toMatchObject({
      day: 1,
      stepsDate: '2026-11-19',
      stepsEntered: null,
      walk: null,
      kmAtDayStart: 0,
      kmToday: 0,
    });
    expect(today.history).toEqual([]);
  });

  it('starts day 1 with the first steps and walks them from 06:00', () => {
    const today = journeyDay({
      startedOn: '2026-11-20',
      dailyGoal: GOAL,
      daylight: DAY,
      entries: [entry('2026-11-19', 10_000, 5)],
      today: '2026-11-20',
    });

    expect(today).toMatchObject({ day: 1, stepsEntered: 10_000, walk: { startHour: 6, endHour: 20 }, kmToday: 7.5 });
    expect(today.history).toEqual([{ day: 1, date: '2026-11-19', steps: 10_000 }]);
  });

  it('counts the days on the road from the first one', () => {
    const today = journeyDay({
      startedOn: '2026-11-18',
      dailyGoal: GOAL,
      daylight: DAY,
      entries: [],
      today: '2026-11-20',
    });

    expect(today.day).toBe(3);
  });

  it('adds up the distance of every earlier day as walked', () => {
    const today = journeyDay({
      startedOn: '2026-11-18',
      dailyGoal: GOAL,
      daylight: DAY,
      entries: [entry('2026-11-17', 10_000), entry('2026-11-18', 4_000)],
      today: '2026-11-20',
    });

    expect(today.kmAtDayStart).toBe(10.5);
  });

  it('treats a day whose steps were never entered as a rest day', () => {
    const today = journeyDay({
      startedOn: '2026-11-18',
      dailyGoal: GOAL,
      daylight: DAY,
      entries: [entry('2026-11-17', 10_000), entry('2026-11-19', 6_000)],
      today: '2026-11-20',
    });

    expect(today.history).toEqual([
      { day: 1, date: '2026-11-17', steps: 10_000 },
      { day: 2, date: '2026-11-18', steps: 0 },
      { day: 3, date: '2026-11-19', steps: 6_000 },
    ]);
  });

  it('waits for yesterday and walks nothing until it is entered', () => {
    const today = journeyDay({
      startedOn: '2026-11-18',
      dailyGoal: GOAL,
      daylight: DAY,
      entries: [entry('2026-11-17', 10_000)],
      today: '2026-11-20',
    });

    expect(today).toMatchObject({ stepsEntered: null, walk: null, kmToday: 0 });
    expect(today.history.map((day) => day.day)).toEqual([1, 2]);
  });

  it('keeps yesterday as zero steps a rest day with nothing to walk', () => {
    const today = journeyDay({
      startedOn: '2026-11-20',
      dailyGoal: GOAL,
      daylight: DAY,
      entries: [entry('2026-11-19', 0)],
      today: '2026-11-20',
    });

    expect(today).toMatchObject({ stepsEntered: 0, walk: null, kmToday: 0 });
  });

  it('counts steps entered at night towards the distance without a walk on screen', () => {
    const today = journeyDay({
      startedOn: '2026-11-20',
      dailyGoal: GOAL,
      daylight: DAY,
      entries: [entry('2026-11-19', 10_000, 21)],
      today: '2026-11-20',
    });

    expect(today).toMatchObject({ walk: null, kmToday: 7.5 });
  });
});
