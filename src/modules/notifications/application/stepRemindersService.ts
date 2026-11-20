import { localDate } from '../../../shared/journey/calendar.js';
import type { Clock, Mail, Mailer, ReminderRepository } from '../domain/ports.js';
import { dueReminder, type ReminderSlot } from '../domain/stepReminder.js';

export interface StepRemindersDependencies {
  readonly reminders: ReminderRepository;
  readonly mailer: Mailer;
  readonly clock: Clock;
  /** The game's address, for the link in the e-mail, e.g. https://wayfarer.mgrabowski.eu. */
  readonly appUrl: string;
}

export interface ReminderRun {
  readonly sent: number;
  readonly failed: number;
}

/** The e-mail for one reminder, in Polish like the rest of the game. */
export function stepReminderMail(to: string, slot: ReminderSlot, appUrl: string): Mail {
  const link = `${appUrl.replace(/\/+$/, '')}/scene`;
  const footer = 'Przypomnienia wyłączysz w grze: Menu → Ustawienia → Powiadomienia.';
  return slot === 'morning'
    ? {
        to,
        subject: 'Wpisz wczorajsze kroki',
        text: `Dzień dobry!\n\nWędrowiec czeka przy ognisku na wczorajsze kroki. Wpisz je, a ruszy w drogę:\n${link}\n\n${footer}\n`,
      }
    : {
        to,
        subject: 'Wędrowiec wciąż czeka na kroki',
        text: `Wczorajsze kroki nadal nie są wpisane. Możesz to zrobić do północy, potem ten dzień przepadnie:\n${link}\n\n${footer}\n`,
      };
}

/**
 * Sends the reminders due now. Run it often (every 15 minutes from cron); it is safe to run twice or
 * in parallel, since each reminder is claimed before it is sent. A failed e-mail is retried next run.
 */
export async function sendStepReminders(deps: StepRemindersDependencies): Promise<ReminderRun> {
  const now = deps.clock.now();
  let sent = 0;
  let failed = 0;
  for (const candidate of await deps.reminders.candidates()) {
    const slot = dueReminder(candidate, now);
    if (slot === null) continue;
    const date = localDate(now, candidate.timeZone);
    if (!(await deps.reminders.claim(candidate.accountId, date, slot))) continue;
    try {
      await deps.mailer.send(stepReminderMail(candidate.email, slot, deps.appUrl));
      sent++;
    } catch {
      await deps.reminders.release(candidate.accountId, date, slot);
      failed++;
    }
  }
  return { sent, failed };
}
