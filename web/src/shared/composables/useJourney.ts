import { computed, readonly, ref } from 'vue';
import type { JourneyResponse } from '@shared/api/contracts';
import { changeJourney, fetchJourney, planJourney, recordYesterdaySteps } from '@/shared/api/journey';

// One journey per tab, shared by the router guard and every screen.
const current = ref<JourneyResponse | null>(null);
let loaded: Promise<JourneyResponse | null> | null = null;

const browserTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * The signed-in player's journey, from the server. Days, "yesterday" and the walk are all decided there,
 * in the journey's time zone, so a changed phone clock can't add a day.
 */
export function useJourney() {
  const ensure = async (): Promise<JourneyResponse | null> => {
    loaded ??= fetchJourney().catch((error: unknown) => {
      loaded = null;
      throw error;
    });
    current.value = await loaded;
    return current.value;
  };
  const replace = (next: JourneyResponse): JourneyResponse => {
    current.value = next;
    loaded = Promise.resolve(next);
    return next;
  };

  // The distance counts as soon as the steps are in, so the player sees at once what they earned; the
  // traveller on screen only spreads it over the day.
  /** Distance on the current route, today's steps included. */
  const kmOnRoute = computed(() => {
    const j = current.value;
    return j ? Math.max(0, j.today.kmAtDayStart + j.today.kmToday - j.journey.routeSinceKm) : 0;
  });
  /** What today's steps add, on the current route. */
  const kmToday = computed(() => Math.min(current.value?.today.kmToday ?? 0, kmOnRoute.value));

  return {
    journey: readonly(current),
    kmOnRoute,
    kmToday,
    ensure,
    /** Reloads from the server, e.g. once a new day has begun. */
    refresh: async (): Promise<JourneyResponse | null> => {
      loaded = null;
      return ensure();
    },
    plan: async (routeId: string, dailySteps: number) =>
      replace(await planJourney(routeId, dailySteps, browserTimeZone())),
    change: async (routeId: string, dailySteps: number) => replace(await changeJourney(routeId, dailySteps)),
    recordYesterday: async (steps: number) => replace(await recordYesterdaySteps(steps)),
  };
}

/** Forgets the journey, e.g. when a player signs in or out, so one account never sees another's. */
export function forgetJourney(): void {
  current.value = null;
  loaded = null;
}
