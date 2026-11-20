import { readonly, ref } from 'vue';

// Once per page load: the splash screen plays when the app starts and never again until a reload.
const playing = ref(true);

/** Whether the splash screen still covers the app; windows meant to be open at start wait for it. */
export function useSplash() {
  return {
    playing: readonly(playing),
    finish: (): void => {
      playing.value = false;
    },
  };
}

/** Test helper: as if the page had just loaded (or, with false, as if the splash had already played). */
export function setSplashPlayingForTests(value: boolean): void {
  playing.value = value;
}
