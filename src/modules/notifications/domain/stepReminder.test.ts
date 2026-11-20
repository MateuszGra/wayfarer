import { describe, expect, it } from 'vitest';
import { dueReminder, type ReminderCandidate } from './stepReminder';

// Warsaw is UTC+1 in November: 09:00Z is 10:00 there.
const player = (overrides: Partial<ReminderCandidate> = {}): ReminderCandidate => ({
  accountId: 'a1',
  email: 'ana@example.com',
  timeZone: 'Europe/Warsaw',
  lastStepsDate: '2026-11-19',
  sent: [],
  ...overrides,
});

describe('dueReminder', () => {
  it.each([
    { at: '2026-11-21T08:59:00Z', local: '09:59', due: null },
    { at: '2026-11-21T09:00:00Z', local: '10:00', due: 'morning' },
    { at: '2026-11-21T20:59:00Z', local: '21:59', due: 'morning' },
    { at: '2026-11-21T21:00:00Z', local: '22:00', due: 'evening' },
    { at: '2026-11-21T22:59:00Z', local: '23:59', due: 'evening' },
    { at: '2026-11-21T23:00:00Z', local: '00:00 the next day', due: null },
  ])('returns $due at $local when yesterday’s steps are missing', ({ at, due }) => {
    expect(dueReminder(player(), new Date(at))).toBe(due);
  });

  it('sends nothing once yesterday’s steps are entered', () => {
    expect(dueReminder(player({ lastStepsDate: '2026-11-20' }), new Date('2026-11-21T21:00:00Z'))).toBeNull();
  });

  it('reminds a player who has not entered any steps yet', () => {
    expect(dueReminder(player({ lastStepsDate: null }), new Date('2026-11-21T09:00:00Z'))).toBe('morning');
  });

  it('sends the morning reminder only once a day', () => {
    const sent = [{ date: '2026-11-21', slot: 'morning' as const }];

    expect(dueReminder(player({ sent }), new Date('2026-11-21T15:00:00Z'))).toBeNull();
  });

  it('still sends the evening reminder after the morning one', () => {
    const sent = [{ date: '2026-11-21', slot: 'morning' as const }];

    expect(dueReminder(player({ sent }), new Date('2026-11-21T21:00:00Z'))).toBe('evening');
  });

  it('sends the morning reminder again the next day', () => {
    const sent = [{ date: '2026-11-21', slot: 'morning' as const }];

    expect(dueReminder(player({ lastStepsDate: '2026-11-20', sent }), new Date('2026-11-22T09:00:00Z'))).toBe(
      'morning',
    );
  });

  it('keeps to the player’s own time zone', () => {
    // 10:00 in Lisbon (UTC+0) is 11:00 in Warsaw; at 09:00Z it is still 09:00 in Lisbon.
    expect(dueReminder(player({ timeZone: 'Europe/Lisbon' }), new Date('2026-11-21T09:00:00Z'))).toBeNull();
  });
});
