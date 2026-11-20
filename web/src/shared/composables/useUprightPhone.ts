import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

const QUERY = '(orientation: portrait) and (pointer: coarse)';

/** Whether a touch device is held upright right now; follows the phone as it turns. */
export function useUprightPhone(): Ref<boolean> {
  const list = typeof matchMedia === 'function' ? matchMedia(QUERY) : null;
  const upright = ref(list?.matches ?? false);
  const update = (event: MediaQueryListEvent): void => {
    upright.value = event.matches;
  };
  onMounted(() => list?.addEventListener('change', update));
  onBeforeUnmount(() => list?.removeEventListener('change', update));
  return upright;
}
