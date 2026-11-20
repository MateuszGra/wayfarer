import { addDays, localDate, localHour, type LocalDate } from '../../../shared/journey/calendar.js';

/** The two daily reminders: the morning one, and the evening one if the steps are still missing. */
export type ReminderSlot = 'morning' | 'evening';

// Local hours. Yesterday's steps can be entered only until midnight, so 22:00 is the last useful call.
export const REMINDER_HOURS: Readonly<Record<ReminderSlot, number>> = { morning: 10, evening: 22 };

export interface SentReminder {
  readonly date: LocalDate;
  readonly slot: ReminderSlot;
}

/** A player who has a journey and has not turned reminders off. */
export interface ReminderCandidate {
  readonly accountId: string;
  readonly email: string;
  readonly timeZone: string;
  /** The latest day the player entered steps for, or null before the first entry. */
  readonly lastStepsDate: LocalDate | null;
  /** Reminders already sent lately; older ones may be left out. */
  readonly sent: readonly SentReminder[];
}

/**
 * Which reminder the player should get at `now`, if any. Each is sent once a day and only while
 * yesterday's steps are missing. A cron run late after 10:00 still sends the morning one, but never after
 * 22:00, when the evening one takes over.
 */
export function dueReminder(candidate: ReminderCandidate, now: Date): ReminderSlot | null {
  const today = localDate(now, candidate.timeZone);
  if (candidate.lastStepsDate === addDays(today, -1)) return null;
  const hour = localHour(now, candidate.timeZone);
  const slot: ReminderSlot | null =
    hour >= REMINDER_HOURS.evening ? 'evening' : hour >= REMINDER_HOURS.morning ? 'morning' : null;
  if (slot === null) return null;
  return candidate.sent.some((sent) => sent.date === today && sent.slot === slot) ? null : slot;
}
