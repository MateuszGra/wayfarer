import { computed, readonly, ref } from 'vue';
import type { SightingId } from '@shared/achievements/worldEvents';
import { fetchWorldEvents, recordWorldEvent } from '@/shared/api/achievements';

// One list per tab, shared by the scene (which reports sightings) and the achievements window.
const seen = ref<readonly SightingId[]>([]);
// Whether the list has been asked for and the server answered, either way.
const settled = ref(false);
let loaded: Promise<void> | null = null;

/**
 * The moments in the world the player has seen. A sighting is sent once; a failed request is quiet and
 * the next sighting of the same moment tries again.
 */
export function useWorldEvents() {
  const ensure = (): Promise<void> => {
    loaded ??= fetchWorldEvents()
      .then((response) => {
        seen.value = response.seen.map((entry) => entry.id);
      })
      .catch(() => {
        loaded = null;
      })
      .finally(() => {
        settled.value = true;
      });
    return loaded;
  };
  const record = async (event: SightingId): Promise<void> => {
    if (seen.value.includes(event)) return;
    seen.value = [...seen.value, event];
    try {
      seen.value = (await recordWorldEvent(event)).seen.map((entry) => entry.id);
    } catch {
      seen.value = seen.value.filter((id) => id !== event);
    }
  };
  return { seen: readonly(seen), settled: readonly(settled), ensure, record, count: computed(() => seen.value.length) };
}

/** Test helper: as if the page had just loaded. */
export function forgetWorldEventsForTests(): void {
  seen.value = [];
  settled.value = false;
  loaded = null;
}
