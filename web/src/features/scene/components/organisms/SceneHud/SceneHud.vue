<script setup lang="ts">
import { computed } from 'vue';
import type { WandererStatus } from '@/scene-engine';
import { t } from '@/shared/i18n';
import StatLine from '../../molecules/StatLine/StatLine.vue';

export interface Props {
  routeId: 'baltic-santiago';
  doneKm: number;
  totalKm: number;
  day: number;
  status: WandererStatus;
}

defineOptions({ name: 'SceneHud' });
const props = defineProps<Props>();

const distance = computed(() =>
  t('scene.distance', { done: props.doneKm.toFixed(1).replace('.', ','), total: props.totalKm }),
);
const details = computed(() => `${t('scene.day', { day: props.day })} · ${t(`scene.status.${props.status}`)}`);
const progress = computed(() => `${Math.min(100, (props.doneKm / props.totalKm) * 100).toFixed(2)}%`);
</script>

<template>
  <header class="scene-hud">
    <p class="scene-hud__brand">WAYFARER</p>
    <StatLine :text="t(`route.${routeId}`)" emphasis data-testid="hud-route" />
    <div class="scene-hud__bar" aria-hidden="true"><div class="scene-hud__fill" :style="{ width: progress }" /></div>
    <StatLine :text="distance" data-testid="hud-distance" />
    <StatLine :text="details" data-testid="hud-details" />
  </header>
</template>

<style scoped>
.scene-hud {
  position: absolute;
  top: max(var(--space-4), env(safe-area-inset-top));
  left: var(--gutter);
  pointer-events: none;
}
.scene-hud__brand {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.32em;
  color: var(--fg-dim);
}
.scene-hud__bar {
  margin-top: var(--space-2);
  width: 220px;
  max-width: 60vw;
  height: 3px;
  border-radius: 3px;
  background: var(--line);
  overflow: hidden;
}
.scene-hud__fill {
  height: 100%;
  background: var(--accent);
}
</style>
