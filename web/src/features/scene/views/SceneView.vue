<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { SceneSnapshot } from '@/scene-engine';
import GameMenu from '@/shared/components/organisms/GameMenu/GameMenu.vue';
import { useGameMenu } from '@/shared/composables/useGameMenu';
import { useSceneHost } from '@/shared/composables/useSceneHost';
import { useStoredFlag } from '@/shared/composables/useStoredFlag';
import { beardLength } from '@shared/wanderer/beard';
import { t } from '@/shared/i18n';
import DevPanel from '../components/organisms/DevPanel/DevPanel.vue';
import AchievementsDialog from '../components/organisms/AchievementsDialog/AchievementsDialog.vue';
import MapDialog from '../components/organisms/MapDialog/MapDialog.vue';
import SceneHud from '../components/organisms/SceneHud/SceneHud.vue';
import { useClockHour } from '../composables/useClockHour';

defineOptions({ name: 'SceneView' });

// The developer panel is part of dev builds only; `?dev` turns it on in a production build for testing.
const query = new URLSearchParams(location.search);
const devMode = import.meta.env.DEV || query.has('dev');
const DAY_LENGTHS_MINUTES = [2, 10, 60] as const;

// `?menu`, `?map` or `?achievements` in dev mode starts with that window open, for reviewing its design.
const startOverlay = devMode
  ? ((['menu', 'map', 'achievements'] as const).find((name) => query.has(name)) ?? null)
  : null;
const menu = useGameMenu(startOverlay);

const host = ref<HTMLElement | null>(null);
const clockHour = useClockHour();
const snapshot = ref<SceneSnapshot | null>(null);
// `?hour=13.5` in dev mode starts at that hour instead of following the clock.
const startHour = devMode && query.has('hour') ? Number(query.get('hour')) : null;
const followClock = ref(startHour === null);
const dayLengthIndex = ref(0);
const devPanelCollapsed = useStoredFlag('wayfarer.devPanelCollapsed');
// The beard follows the days on the road; the developer slider picks another day until the page reloads.
const beardDayOverride = ref<number | null>(null);
const beardDay = computed(() => beardDayOverride.value ?? snapshot.value?.day ?? 1);
const beard = computed(() => beardLength(beardDay.value));

const scene = useSceneHost(host, () => ({
  hour: startHour ?? clockHour.value,
  biome: 'baltic',
  auto: false,
  dayLengthSeconds: DAY_LENGTHS_MINUTES[0] * 60,
  // `?t=12` in dev mode jumps the animation loops (pipe, bird, lighthouse) to that second.
  animationTime: devMode ? Number(query.get('t') ?? 0) : 0,
  onSnapshot: (next) => (snapshot.value = next),
}));
const biomeIds = computed(() => scene.value?.biomeIds ?? []);
watch([scene, beard], ([created, length]) => created?.setBeard(length));
watch(clockHour, (hour) => {
  if (followClock.value) scene.value?.setHour(hour);
});

const setHour = (hour: number): void => {
  followClock.value = false;
  scene.value?.setAuto(false);
  scene.value?.setHour(hour);
};
const togglePlay = (): void => {
  followClock.value = false;
  scene.value?.setAuto(!snapshot.value?.auto);
};
const backToNow = (): void => {
  followClock.value = true;
  scene.value?.setAuto(false);
  scene.value?.setHour(clockHour.value);
};
const cycleDayLength = (): void => {
  dayLengthIndex.value = (dayLengthIndex.value + 1) % DAY_LENGTHS_MINUTES.length;
  scene.value?.setDayLength((DAY_LENGTHS_MINUTES[dayLengthIndex.value] ?? 2) * 60);
};
</script>

<template>
  <main class="scene-view">
    <div ref="host" class="scene-view__canvas" role="img" :aria-label="t('scene.canvasLabel')" />
    <SceneHud
      v-if="snapshot"
      route-id="baltic-santiago"
      :done-km="snapshot.km"
      :total-km="3200"
      :day="snapshot.day"
      :status="snapshot.status"
    />
    <GameMenu
      :open="menu.overlay.value === 'menu'"
      :entries="menu.entries"
      :covered="menu.overlay.value !== null && menu.overlay.value !== 'menu'"
      @update:open="menu.show('menu')($event)"
      @select="menu.select"
      @logout="menu.logout"
    />
    <MapDialog :open="menu.overlay.value === 'map'" @update:open="menu.show('map')($event)" />
    <AchievementsDialog
      :open="menu.overlay.value === 'achievements'"
      @update:open="menu.show('achievements')($event)"
    />
    <DevPanel
      v-if="devMode && snapshot"
      class="scene-view__dev-panel"
      :hour="snapshot.hour"
      :playing="snapshot.auto"
      :day-length-minutes="DAY_LENGTHS_MINUTES[dayLengthIndex] ?? 2"
      :biome="snapshot.biome"
      :biome-ids="biomeIds"
      :beard-day="beardDay"
      :collapsed="devPanelCollapsed"
      @update:collapsed="devPanelCollapsed = $event"
      @update:beard-day="beardDayOverride = $event"
      @update:hour="setHour"
      @toggle-play="togglePlay"
      @now="backToNow"
      @cycle-day-length="cycleDayLength"
      @select-biome="(id) => scene?.setBiome(id)"
      @reseed="scene?.reseed()"
    />
  </main>
</template>

<style scoped>
.scene-view,
.scene-view__canvas {
  position: absolute;
  inset: 0;
}
.scene-view__dev-panel {
  top: calc(max(var(--space-4), env(safe-area-inset-top)) + 56px);
}
</style>
