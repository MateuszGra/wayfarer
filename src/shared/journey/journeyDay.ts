import { distanceKm, walkingWindow, type WalkingWindow } from '../steps/dailyWalk.js';
import { addDays, daysBetween, type LocalDate } from './calendar.js';

/** Steps the player walked on `date`, which the traveller walks the day after. */
export interface StepEntry {
  readonly date: LocalDate;
  readonly steps: number;
  /** Local hour on the next day when these steps were first entered; the walk can't start before it. */
  readonly enteredAtHour: number;
}

export interface JourneyDayInput {
  /** The first day on the road: the day the first steps were entered, or null before that. */
  readonly startedOn: LocalDate | null;
  readonly dailyGoal: number;
  readonly entries: readonly StepEntry[];
  readonly today: LocalDate;
}

export interface HistoryDay {
  /** Day on the road, counting from 1. */
  readonly day: number;
  /** The date the steps were walked by the player. */
  readonly date: LocalDate;
  readonly steps: number;
}

export interface JourneyDay {
  /** Today in the player's time zone. */
  readonly today: LocalDate;
  /** Day on the road today; day 1 until the first steps are in. */
  readonly day: number;
  /** The date whose steps the player is asked for today. */
  readonly stepsDate: LocalDate;
  /** Yesterday's steps if already entered (they can be corrected until midnight), else null. */
  readonly stepsEntered: number | null;
  /** Today's walk on screen, or null: a rest day, or the steps came too late to walk them on screen. */
  readonly walk: WalkingWindow | null;
  /** Distance covered by the end of yesterday's walk. */
  readonly kmAtDayStart: number;
  /** Distance today's walk adds. */
  readonly kmToday: number;
  /** Every day on the road so far, today included once its steps are in; a missed day counts as rest. */
  readonly history: readonly HistoryDay[];
}

/**
 * Where the journey stands today. The traveller walks on yesterday's steps; a day whose steps were never
 * entered is a rest day (zero steps), and days before the first entry don't exist on the road.
 */
export function journeyDay({ startedOn, dailyGoal, entries, today }: JourneyDayInput): JourneyDay {
  const stepsDate = addDays(today, -1);
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));
  const todayEntry = byDate.get(stepsDate) ?? null;
  const first = startedOn ?? today;
  const day = Math.max(1, daysBetween(first, today) + 1);

  const history: HistoryDay[] = [];
  let kmAtDayStart = 0;
  for (let walkDay = 1; walkDay <= day; walkDay++) {
    const date = addDays(first, walkDay - 2);
    const steps = byDate.get(date)?.steps ?? 0;
    if (walkDay < day) kmAtDayStart += distanceKm(steps);
    if (walkDay < day || todayEntry) history.push({ day: walkDay, date, steps });
  }

  return {
    today,
    day,
    stepsDate,
    stepsEntered: todayEntry?.steps ?? null,
    walk: todayEntry ? walkingWindow(todayEntry.steps, dailyGoal, todayEntry.enteredAtHour) : null,
    kmAtDayStart,
    kmToday: todayEntry ? distanceKm(todayEntry.steps) : 0,
    history: startedOn ? history : [],
  };
}
