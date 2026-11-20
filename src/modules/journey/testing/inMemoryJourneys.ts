import type { StepEntry } from '../../../shared/journey/journeyDay.js';
import type { JourneyDependencies } from '../application/journeyService.js';
import { Journey } from '../domain/journey.js';
import type { JourneyRepository } from '../domain/ports.js';

/** A clock tests move by hand. */
export class FakeJourneyClock {
  constructor(private current: Date) {}
  now(): Date {
    return this.current;
  }
  set(to: Date): void {
    this.current = to;
  }
}

export interface InMemoryJourneys extends JourneyDependencies {
  readonly clock: FakeJourneyClock;
}

/** Journey dependencies without a database: journeys in a map, a fixed route list, numbered ids. */
export function createInMemoryJourneys(
  start = new Date('2026-11-20T08:00:00Z'),
  routeIds: readonly string[] = ['baltic-santiago'],
): InMemoryJourneys {
  const journeys = new Map<string, Journey>();
  let nextId = 1;
  const repo: JourneyRepository = {
    async findByAccount(accountId) {
      const found = [...journeys.values()].find((j) => j.snapshot().accountId === accountId);
      return found ? Journey.restore(found.snapshot()) : null;
    },
    async add(journey) {
      if ([...journeys.values()].some((j) => j.snapshot().accountId === journey.snapshot().accountId)) return false;
      journeys.set(journey.snapshot().id, Journey.restore(journey.snapshot()));
      return true;
    },
    async savePlan(journey) {
      const stored = journeys.get(journey.snapshot().id);
      const entries: readonly StepEntry[] = stored?.snapshot().entries ?? [];
      journeys.set(journey.snapshot().id, Journey.restore({ ...journey.snapshot(), entries }));
    },
    async saveEntry(journeyId, entry) {
      const stored = journeys.get(journeyId);
      if (!stored) return;
      const s = stored.snapshot();
      const existing = s.entries.find((e) => e.date === entry.date);
      const kept: StepEntry = existing ? { ...entry, enteredAtHour: existing.enteredAtHour } : entry;
      journeys.set(
        journeyId,
        Journey.restore({ ...s, entries: [...s.entries.filter((e) => e.date !== entry.date), kept] }),
      );
    },
  };
  return {
    journeys: repo,
    routes: { exists: async (id) => routeIds.includes(id) },
    clock: new FakeJourneyClock(start),
    newId: () => `journey-${nextId++}`,
    // Słupsk, where every player is until regions come from IP addresses.
    place: { latitude: 54.46, longitude: 17.03 },
  };
}
