/** A calendar date as `YYYY-MM-DD`, always in the player's own time zone. */
export type LocalDate = string;

const parts = (now: Date, timeZone: string) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );

/** The date it is at `now` in `timeZone`. */
export function localDate(now: Date, timeZone: string): LocalDate {
  const p = parts(now, timeZone);
  return `${p['year']}-${p['month']}-${p['day']}`;
}

/** The time of day at `now` in `timeZone`, in hours (14.5 is 14:30). */
export function localHour(now: Date, timeZone: string): number {
  const p = parts(now, timeZone);
  return Number(p['hour']) + Number(p['minute']) / 60 + Number(p['second']) / 3600;
}

/** Whether `timeZone` is a time zone this runtime knows, e.g. `Europe/Warsaw`. */
export function isTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone });
    return true;
  } catch {
    return false;
  }
}

// Calendar arithmetic on the date alone, at UTC noon, so daylight-saving shifts can't move a day.
const toNoon = (date: LocalDate): number => Date.parse(`${date}T12:00:00Z`);
const DAY_MS = 86_400_000;

export function addDays(date: LocalDate, days: number): LocalDate {
  return new Date(toNoon(date) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((toNoon(to) - toNoon(from)) / DAY_MS);
}
