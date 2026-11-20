<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SplashLoader from '@/shared/components/organisms/SplashLoader/SplashLoader.vue';
import { useSplash } from '@/shared/composables/useSplash';
import { useUprightPhone } from '@/shared/composables/useUprightPhone';

defineOptions({ name: 'App' });
const splash = useSplash();
const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// The splash waits for the first screen to be known, and on a landscape-only screen (the game) seen on a
// phone held upright it waits until the phone is turned: it should be seen, not played behind the "turn
// your phone" page. It plays once; turning the phone again later doesn't bring it back.
const route = useRoute();
const routed = ref(false);
void useRouter()
  .isReady()
  .then(() => (routed.value = true));
const upright = useUprightPhone();
const waitingForTurn = computed(() => route.meta.landscape === true && upright.value);
const started = ref(false);
const showSplash = computed(() => splash.playing.value && routed.value && (started.value || !waitingForTurn.value));
// Milliseconds already spent before the splash appeared, which it takes off its two seconds: the page's
// loading time normally, nothing when it had to wait for the phone to be turned.
const elapsedMs = ref(0);
let waited = false;
watch(waitingForTurn, (waiting) => (waited ||= waiting && !started.value), { immediate: true });
watch(
  showSplash,
  (show) => {
    if (!show || started.value) return;
    started.value = true;
    elapsedMs.value = waited || typeof performance !== 'object' ? 0 : performance.now();
  },
  { immediate: true },
);
</script>

<template>
  <div class="app">
    <RouterView />
    <SplashLoader v-if="showSplash" :reduced-motion="reducedMotion" :elapsed-ms="elapsedMs" @done="splash.finish" />
  </div>
</template>

<style scoped>
.app {
  position: relative;
  height: 100%;
  overflow: hidden;
}
</style>
