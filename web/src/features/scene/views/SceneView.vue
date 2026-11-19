<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createScene, type Scene } from '@/scene-engine';
import { t } from '@/shared/i18n';
import SceneHud from '../components/organisms/SceneHud/SceneHud.vue';
import { useClockHour } from '../composables/useClockHour';

defineOptions({ name: 'SceneView' });

const host = ref<HTMLElement | null>(null);
const hour = useClockHour();
// The engine stays outside Vue reactivity: it redraws every frame, Vue only pushes state changes.
let scene: Scene | null = null;
let unmounted = false;

onMounted(async () => {
  if (!host.value) return;
  const created = await createScene(host.value, { hour: hour.value });
  // The view may be left while the scene is still starting; don't leak that Pixi application.
  if (unmounted) created.destroy();
  else scene = created;
});
watch(hour, (value) => scene?.setState({ hour: value }));
onBeforeUnmount(() => {
  unmounted = true;
  scene?.destroy();
});
</script>

<template>
  <main class="scene-view">
    <div ref="host" class="scene-view__canvas" role="img" :aria-label="t('scene.canvasLabel')" />
    <SceneHud route-id="baltic-santiago" :done-km="214" :total-km="3200" :hour="hour" />
  </main>
</template>

<style scoped>
.scene-view,
.scene-view__canvas {
  position: absolute;
  inset: 0;
}
</style>
