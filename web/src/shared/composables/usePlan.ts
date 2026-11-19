import { ref, watch } from 'vue';

export const DEFAULT_DAILY_STEPS = 10_000;
const STORAGE_KEY = 'wayfarer.plan';

interface StoredPlan {
  routeId: string | null;
  dailySteps: number;
}

function read(): StoredPlan {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<StoredPlan> | null;
    return {
      routeId: typeof parsed?.routeId === 'string' ? parsed.routeId : null,
      dailySteps: typeof parsed?.dailySteps === 'number' ? parsed.dailySteps : DEFAULT_DAILY_STEPS,
    };
  } catch {
    return { routeId: null, dailySteps: DEFAULT_DAILY_STEPS };
  }
}

/**
 * The player's chosen route and daily step goal. Kept in the browser until the player's account
 * lives on the server; storage can be unavailable (private mode), so failures fall back to defaults.
 */
export function usePlan() {
  const stored = read();
  const routeId = ref<string | null>(stored.routeId);
  const dailySteps = ref(stored.dailySteps);

  watch([routeId, dailySteps], ([id, steps]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ routeId: id, dailySteps: steps }));
    } catch {
      // Not saved; the plan still works for this visit.
    }
  });

  return { routeId, dailySteps };
}
