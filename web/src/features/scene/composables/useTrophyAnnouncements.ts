import { computed, ref, watch, type Ref } from 'vue';
import type { TrophyId, TrophyProgress } from '@shared/achievements/trophies';

/**
 * Trophies won while the game is open, one at a time, to be celebrated. Whatever is already won when the
 * player's data first arrives counts as known and is never announced, so a reload doesn't replay them.
 */
export function useTrophyAnnouncements(trophies: Ref<readonly TrophyProgress[]>, ready: Ref<boolean>) {
  let known: Set<TrophyId> | null = null;
  const queue = ref<TrophyProgress[]>([]);
  watch(
    [trophies, ready],
    ([list, isReady]) => {
      if (!isReady) return;
      const won = list.filter((trophy) => trophy.won);
      if (!known) {
        known = new Set(won.map((trophy) => trophy.id));
        return;
      }
      for (const trophy of won) {
        if (known.has(trophy.id)) continue;
        known.add(trophy.id);
        queue.value = [...queue.value, trophy];
      }
    },
    { immediate: true },
  );
  return {
    current: computed(() => queue.value[0] ?? null),
    dismiss: (): void => {
      queue.value = queue.value.slice(1);
    },
  };
}
