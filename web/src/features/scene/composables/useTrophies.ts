import { computed } from 'vue';
import { trophyProgress, worldTrophyProgress } from '@shared/achievements/trophies';
import { goalStreak, summarize } from '@shared/steps/history';
import { useJourney } from '@/shared/composables/useJourney';
import { useWorldEvents } from '@/shared/composables/useWorldEvents';

/** Every trophy and how far the player is towards it: those earned on the road and those seen in the world. */
export function useTrophies() {
  const journey = useJourney();
  const worldEvents = useWorldEvents();
  void worldEvents.ensure();
  const history = computed(() => journey.journey.value?.today.history ?? []);
  // Each day is judged against the current goal until the goal history is stored on the server.
  const dailySteps = computed(() => journey.journey.value?.journey.dailySteps ?? 0);
  const summary = computed(() => summarize(history.value, dailySteps.value));
  const road = computed(() =>
    trophyProgress({ totalSteps: summary.value.totalSteps, streak: goalStreak(history.value, dailySteps.value) }),
  );
  const world = computed(() => worldTrophyProgress(worldEvents.seen.value));
  const all = computed(() => [...road.value, ...world.value]);
  // Both sources have answered (or failed), so what is won now is what the player already had.
  const ready = computed(() => journey.journey.value !== null && worldEvents.settled.value);
  return { history, dailySteps, summary, road, world, all, ready };
}
