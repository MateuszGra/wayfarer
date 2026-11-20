<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import SplashLoader from '@/shared/components/organisms/SplashLoader/SplashLoader.vue';
import { useSplash } from '@/shared/composables/useSplash';

defineOptions({ name: 'App' });
const splash = useSplash();
const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// The splash waits for the first screen to be known. Milliseconds already spent before it appeared, the
// page's loading time, come off its two seconds.
const routed = ref(false);
void useRouter()
  .isReady()
  .then(() => (routed.value = true));
const showSplash = computed(() => splash.playing.value && routed.value);
const elapsedMs = typeof performance === 'object' ? performance.now() : 0;
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
