import type { LocalDate } from '../../../shared/journey/calendar.js';
import type { ReminderCandidate, ReminderSlot } from './stepReminder.js';

export interface NotificationSettingsRepository {
  /** Whether the player gets step reminders; on until they turn them off. */
  stepReminders(accountId: string): Promise<boolean>;
  setStepReminders(accountId: string, on: boolean): Promise<void>;
}

export interface ReminderRepository {
  /** Players with a journey and reminders on, with what was sent to them lately. */
  candidates(): Promise<readonly ReminderCandidate[]>;
  /** Marks the reminder as sent; false when it already was, so only one run sends it. */
  claim(accountId: string, date: LocalDate, slot: ReminderSlot): Promise<boolean>;
  /** Undoes a claim after the e-mail failed, so the next run tries again. */
  release(accountId: string, date: LocalDate, slot: ReminderSlot): Promise<void>;
}

export interface Mail {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

export interface Clock {
  now(): Date;
}
