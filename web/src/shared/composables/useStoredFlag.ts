import { ref, watch, type Ref } from 'vue';

/**
 * A boolean remembered in this browser, for small per-viewer conveniences such as a collapsed panel.
 * Storage can be unavailable (private mode), in which case the flag simply isn't remembered.
 */
export function useStoredFlag(key: string, initial = false): Ref<boolean> {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(key);
  } catch {
    // Not available; use the initial value.
  }
  const flag = ref(stored === null ? initial : stored === 'true');
  watch(flag, (value) => {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // Not saved; it still works until the page reloads.
    }
  });
  return flag;
}
