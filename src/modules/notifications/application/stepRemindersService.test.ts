import { describe, expect, it } from 'vitest';
import type { Mail } from '../domain/ports';
import type { ReminderCandidate, ReminderSlot } from '../domain/stepReminder';
import { sendStepReminders, type StepRemindersDependencies } from './stepRemindersService';

const MORNING = new Date('2026-11-21T09:05:00Z');

// In-memory reminders and an outbox: the repository and the mailer are our own ports.
function setup(players: readonly Omit<ReminderCandidate, 'sent'>[]) {
  const smtp = { down: false };
  const sent = new Set<string>();
  const outbox: Mail[] = [];
  const key = (accountId: string, date: string, slot: ReminderSlot) => `${accountId}|${date}|${slot}`;
  const deps: StepRemindersDependencies = {
    clock: { now: () => MORNING },
    appUrl: 'https://wayfarer.example/',
    reminders: {
      async candidates() {
        return players.map((player) => ({
          ...player,
          sent: [...sent]
            .map((entry) => entry.split('|'))
            .filter(([accountId]) => accountId === player.accountId)
            .map(([, date, slot]) => ({ date: date ?? '', slot: slot as ReminderSlot })),
        }));
      },
      async claim(accountId, date, slot) {
        if (sent.has(key(accountId, date, slot))) return false;
        sent.add(key(accountId, date, slot));
        return true;
      },
      async release(accountId, date, slot) {
        sent.delete(key(accountId, date, slot));
      },
    },
    mailer: {
      async send(mail) {
        if (smtp.down) throw new Error('SMTP down');
        outbox.push(mail);
      },
    },
  };
  return { deps, outbox, smtp };
}
const ana = { accountId: 'a1', email: 'ana@example.com', timeZone: 'Europe/Warsaw', lastStepsDate: '2026-11-19' };

describe('sendStepReminders', () => {
  it('e-mails the morning reminder with a link to the game', async () => {
    const { deps, outbox } = setup([ana]);

    const run = await sendStepReminders(deps);

    expect(run).toEqual({ sent: 1, failed: 0 });
    expect(outbox).toEqual([
      expect.objectContaining({
        to: 'ana@example.com',
        subject: 'Wpisz wczorajsze kroki',
        text: expect.stringContaining('https://wayfarer.example/scene'),
      }),
    ]);
  });

  it('sends a reminder once when the job runs twice', async () => {
    const { deps, outbox } = setup([ana]);

    await sendStepReminders(deps);
    await sendStepReminders(deps);

    expect(outbox).toHaveLength(1);
  });

  it('tries a failed e-mail again on the next run', async () => {
    const { deps, outbox, smtp } = setup([ana]);
    smtp.down = true;
    await sendStepReminders(deps);
    smtp.down = false;

    const retried = await sendStepReminders(deps);

    expect(retried).toEqual({ sent: 1, failed: 0 });
    expect(outbox).toHaveLength(1);
  });

  it('counts a reminder the mail server refused as failed', async () => {
    const { deps, smtp } = setup([ana]);
    smtp.down = true;

    expect(await sendStepReminders(deps)).toEqual({ sent: 0, failed: 1 });
  });

  it('sends nothing to a player who entered yesterday’s steps', async () => {
    const { deps, outbox } = setup([{ ...ana, lastStepsDate: '2026-11-20' }]);

    await sendStepReminders(deps);

    expect(outbox).toEqual([]);
  });
});
