import { beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetWorldEventsForTests, useWorldEvents } from './useWorldEvents';

const api = vi.hoisted(() => ({ fetchWorldEvents: vi.fn(), recordWorldEvent: vi.fn() }));
vi.mock('@/shared/api/achievements', () => api);

beforeEach(() => {
  forgetWorldEventsForTests();
  api.fetchWorldEvents.mockReset().mockResolvedValue({ seen: [] });
  api.recordWorldEvent
    .mockReset()
    .mockResolvedValue({ seen: [{ id: 'bigfootSeen', seenAt: '2026-11-20T19:30:00.000Z' }] });
});

describe('useWorldEvents', () => {
  it('sends a sighting once, however often it happens', async () => {
    const events = useWorldEvents();

    await events.record('bigfootSeen');
    await events.record('bigfootSeen');

    expect(api.recordWorldEvent).toHaveBeenCalledTimes(1);
    expect(events.seen.value).toEqual(['bigfootSeen']);
  });

  it('forgets a sighting the server did not take, so the next one tries again', async () => {
    api.recordWorldEvent.mockRejectedValueOnce(new Error('offline'));
    const events = useWorldEvents();

    await events.record('bigfootSeen');
    await events.record('bigfootSeen');

    expect(api.recordWorldEvent).toHaveBeenCalledTimes(2);
  });
});
