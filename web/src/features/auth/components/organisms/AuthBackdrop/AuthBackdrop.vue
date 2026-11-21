<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSceneHost } from '@/shared/composables/useSceneHost';

defineOptions({ name: 'AuthBackdrop' });

const host = ref<HTMLElement | null>(null);
const now = new Date();

// A random place from the route, at the player's own time of day; the landscape stands still
// and the wanderer only appears once the player is signed in.
const scene = useSceneHost(host, () => ({
  hour: now.getHours() + now.getMinutes() / 60,
  seed: Math.floor(Math.random() * 1000),
  still: true,
  hideWanderer: true,
}));
watch(scene, (created) => {
  const ids = created?.biomeIds ?? [];
  const pick = ids[Math.floor(Math.random() * ids.length)];
  if (created && pick) created.setBiome(pick);
});
</script>

<template>
  <main class="auth-backdrop">
    <div ref="host" class="auth-backdrop__scene" aria-hidden="true" />
    <div class="auth-backdrop__center">
      <slot />
    </div>
  </main>
</template>

<style scoped>
.auth-backdrop,
.auth-backdrop__scene {
  position: absolute;
  inset: 0;
}
.auth-backdrop__center {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  overflow-y: auto;
}
</style>
