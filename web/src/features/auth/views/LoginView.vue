<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSceneHost } from '@/shared/composables/useSceneHost';
import AuthPanel from '../components/organisms/AuthPanel/AuthPanel.vue';

defineOptions({ name: 'LoginView' });

const router = useRouter();
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

// Until the auth API exists, both forms lead straight on to planning the journey.
const enterGame = (): void => void router.push('/start');
</script>

<template>
  <main class="login-view">
    <div ref="host" class="login-view__scene" aria-hidden="true" />
    <div class="login-view__center">
      <AuthPanel @login="enterGame" @register="enterGame" @forgot-password="router.push('/forgot-password')" />
    </div>
  </main>
</template>

<style scoped>
.login-view,
.login-view__scene {
  position: absolute;
  inset: 0;
}
.login-view__center {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  overflow-y: auto;
}
</style>
