import { addDays, isTimeZone, localDate, localHour, type LocalDate } from '../../../shared/journey/calendar.js';
import { journeyDay, type JourneyDay, type StepEntry } from '../../../shared/journey/journeyDay.js';
import { isDailyGoal, isDayOfSteps } from '../../../shared/journey/rules.js';
import { DEFAULT_DAYLIGHT } from '../../../shared/steps/dailyWalk.js';
import { daylightOn, type GeoPoint } from '../../../shared/sun/daylight.js';
import { JourneyError } from './errors.js';

export interface JourneyState {
  readonly id: string;
  readonly accountId: string;
  readonly routeId: string;
  readonly dailySteps: number;
  readonly timeZone: string;
  readonly startedOn: LocalDate | null;
  readonly routeSinceKm: number;
  readonly entries: readonly StepEntry[];
}

/**
 * A player's journey: the route and daily goal they chose, and the steps they entered day by day. The
 * steps for a day are always asked for the next day ("yesterday"), may be corrected until that day ends,
 * and the first entry starts day 1 on the road.
 */
export class Journey {
  private constructor(private state: JourneyState) {}

  static create(id: string, accountId: string, routeId: string, dailySteps: number, timeZone: string): Journey {
    if (!isDailyGoal(dailySteps) || !isTimeZone(timeZone)) throw new JourneyError('validation_failed');
    return new Journey({ id, accountId, routeId, dailySteps, timeZone, startedOn: null, routeSinceKm: 0, entries: [] });
  }

  static restore(state: JourneyState): Journey {
    return new Journey(state);
  }

  snapshot(): JourneyState {
    return this.state;
  }

  /** Records the steps the player walked yesterday; entering them again today corrects them. */
  recordYesterday(steps: number, now: Date): StepEntry {
    if (!isDayOfSteps(steps)) throw new JourneyError('invalid_steps');
    const today = localDate(now, this.state.timeZone);
    const date = addDays(today, -1);
    const existing = this.state.entries.find((entry) => entry.date === date);
    // A correction keeps the hour of the first entry, so a walk already under way isn't restarted.
    const entry: StepEntry = {
      date,
      steps,
      enteredAtHour: existing?.enteredAtHour ?? localHour(now, this.state.timeZone),
    };
    this.state = {
      ...this.state,
      startedOn: this.state.startedOn ?? today,
      entries: [...this.state.entries.filter((e) => e.date !== date), entry],
    };
    return entry;
  }

  /**
   * A new goal applies from now on. A new route starts from its beginning: the distance walked so far
   * stays in the journey (and the days on the road go on), but the position on the new route is counted
   * from this moment.
   */
  changePlan(routeId: string, dailySteps: number, now: Date): void {
    if (!isDailyGoal(dailySteps)) throw new JourneyError('validation_failed');
    const routeSinceKm = routeId === this.state.routeId ? this.state.routeSinceKm : this.kmWalked(now);
    this.state = { ...this.state, routeId, dailySteps, routeSinceKm };
  }

  /** Where the journey stands at `now`; the walk keeps to the daylight at `place`, where the player is. */
  today(now: Date, place: GeoPoint): JourneyDay {
    const date = localDate(now, this.state.timeZone);
    return this.dayAt(date, daylightOn(date, this.state.timeZone, place) ?? DEFAULT_DAYLIGHT);
  }

  private dayAt(today: LocalDate, daylight: JourneyDay['daylight']): JourneyDay {
    const { startedOn, dailySteps, entries } = this.state;
    return journeyDay({ startedOn, dailyGoal: dailySteps, entries, today, daylight });
  }

  /** The whole distance on the road at `now`; today's steps count from the moment they are entered. */
  kmWalked(now: Date): number {
    // Distance doesn't depend on when the sun sets, only the walk on screen does.
    const day = this.dayAt(localDate(now, this.state.timeZone), DEFAULT_DAYLIGHT);
    return day.kmAtDayStart + day.kmToday;
  }
}
