<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { WALK_START_HOUR } from '@shared/steps/dailyWalk';
import type { Weather } from '@shared/weather/weather';
import type { SceneSnapshot, SceneWalk } from '@/scene-engine';
import { apiErrorMessage } from '@/shared/api/errorMessages';
import GameMenu from '@/shared/components/organisms/GameMenu/GameMenu.vue';
import { useGameMenu } from '@/shared/composables/useGameMenu';
import { useJourney } from '@/shared/composables/useJourney';
import { useRoutes } from '@/shared/composables/useRoutes';
import { useSceneHost } from '@/shared/composables/useSceneHost';
import { useSplash } from '@/shared/composables/useSplash';
import { useWeather } from '@/shared/composables/useWeather';
import { useStoredFlag } from '@/shared/composables/useStoredFlag';
import { beardLength } from '@shared/wanderer/beard';
import { t } from '@/shared/i18n';
import DevPanel from '../components/organisms/DevPanel/DevPanel.vue';
import AchievementsDialog from '../components/organisms/AchievementsDialog/AchievementsDialog.vue';
import MapDialog from '../components/organisms/MapDialog/MapDialog.vue';
import RotateHint from '../components/organisms/RotateHint/RotateHint.vue';
import SceneHud from '../components/organisms/SceneHud/SceneHud.vue';
import SettingsDialog from '../components/organisms/SettingsDialog/SettingsDialog.vue';
import YesterdayStepsDialog from '../components/organisms/YesterdayStepsDialog/YesterdayStepsDialog.vue';
import { useClockHour } from '../composables/useClockHour';

defineOptions({ name: 'SceneView' });

// The developer panel is part of dev builds only; `?dev` turns it on in a production build for testing.
const query = new URLSearchParams(location.search);
const devMode = import.meta.env.DEV || query.has('dev');
const DAY_LENGTHS_MINUTES = [2, 10, 60] as const;

// `?menu`, `?map`, `?achievements` or `?settings` in dev mode starts with that window open, for reviewing its design.
const startOverlay = devMode
  ? ((['menu', 'map', 'achievements', 'settings'] as const).find((name) => query.has(name)) ?? null)
  : null;
const host = ref<HTMLElement | null>(null);
// Every second: the traveller gets up within seconds of the steps coming in, so a coarser clock would lag.
const clockHour = useClockHour(undefined, 1000);
const splash = useSplash();
const journey = useJourney();
// The scene shows the weather where the player is; in the developer panel it can be set by hand.
const { weather: apiWeather } = useWeather();
const handWeather = ref<Weather | null>(null);
const CALM_CLEAR: Weather = { sky: 'clear', precipitation: 'none', storm: false, wind: 'breeze', frost: false };
const sceneWeather = computed<Weather>(() => handWeather.value ?? apiWeather.value?.weather ?? CALM_CLEAR);
const today = computed(() => journey.journey.value?.today ?? null);
const { routes } = useRoutes();
const routeLengthKm = computed(
  () => routes.value.find((route) => route.id === journey.journey.value?.journey.routeId)?.lengthKm ?? 0,
);

// Every day starts by asking for yesterday's steps; the day can't begin without them.
const stepsMissing = computed(() => today.value !== null && today.value.stepsEntered === null);
const correcting = ref<number | null>(null);
const stepsOpen = computed(() => !splash.playing.value && (stepsMissing.value || correcting.value !== null));
const stepsPending = ref(false);
const stepsError = ref<string | null>(null);
const saveSteps = async (steps: number): Promise<void> => {
  stepsPending.value = true;
  stepsError.value = null;
  try {
    await journey.recordYesterday(steps);
    correcting.value = null;
  } catch (failure) {
    stepsError.value = apiErrorMessage(failure);
  } finally {
    stepsPending.value = false;
  }
};
const menu = useGameMenu(startOverlay, () => stepsOpen.value);
const correctSteps = (): void => {
  menu.show('achievements')(false);
  correcting.value = today.value?.stepsEntered ?? null;
};

// Steps entered after dawn are walked from the moment they came in: he first gets up, stretches and
// packs for a few seconds, which is the little scene that answers the player's entry.
const PACK_UP_HOURS = 12 / 3600;
const sceneWalk = computed<SceneWalk | null>(() => {
  const walk = today.value?.walk;
  if (!walk) return null;
  return walk.startHour > WALK_START_HOUR
    ? { startHour: walk.startHour + PACK_UP_HOURS, endHour: walk.endHour, leadHours: PACK_UP_HOURS }
    : walk;
});

// A new day (midnight passed, or the game came back from the background) may need new steps.
watch(clockHour, (hour, previous) => {
  if (hour < previous) void journey.refresh();
});
const onVisible = (): void => {
  if (document.visibilityState === 'visible') void journey.refresh();
};
onMounted(() => document.addEventListener('visibilitychange', onVisible));
onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisible));
const snapshot = ref<SceneSnapshot | null>(null);
const followClock = ref(true);
const dayLengthIndex = ref(0);
const devPanelCollapsed = useStoredFlag('wayfarer.devPanelCollapsed');
// The beard follows the days on the road; the developer slider picks another day until the page reloads.
const beardDayOverride = ref<number | null>(null);
const beardDay = computed(() => beardDayOverride.value ?? today.value?.day ?? 1);
const beard = computed(() => beardLength(beardDay.value));

const scene = useSceneHost(host, () => ({
  hour: clockHour.value,
  biome: 'baltic',
  auto: false,
  dayLengthSeconds: DAY_LENGTHS_MINUTES[0] * 60,
  walk: sceneWalk.value,
  // `?t=12` in dev mode jumps the animation loops (pipe, bird, lighthouse) to that second.
  animationTime: devMode ? Number(query.get('t') ?? 0) : 0,
  onSnapshot: (next) => (snapshot.value = next),
}));
const biomeIds = computed(() => scene.value?.biomeIds ?? []);
const levels = computed(() => (scene.value && snapshot.value ? scene.value.levelsOf(snapshot.value.biome) : []));
const behaviours = computed(() => snapshot.value?.behaviours ?? []);
watch([scene, beard], ([created, length]) => created?.setBeard(length));
watch([scene, sceneWalk], ([created, walk]) => created?.setWalk(walk));
watch([scene, sceneWeather], ([created, weather]) => created?.setWeather(weather));
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
    <RotateHint />
    <SceneHud
      v-if="snapshot && today"
      route-id="baltic-santiago"
      :done-km="journey.kmOnRoute.value"
      :today-km="journey.kmToday.value"
      :total-km="routeLengthKm"
      :day="today.day"
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
    <MapDialog :open="menu.overlay.value === 'map'" @update:open="menu.show('map')($event)" @back="menu.back" />
    <AchievementsDialog
      :open="menu.overlay.value === 'achievements'"
      @update:open="menu.show('achievements')($event)"
      @back="menu.back"
      @correct-steps="correctSteps"
    />
    <YesterdayStepsDialog
      v-if="today && journey.journey.value"
      :open="stepsOpen"
      :day="today.day"
      :steps-date="today.stepsDate"
      :correcting="stepsMissing ? null : correcting"
      :pending="stepsPending"
      :error="stepsError"
      @submit="saveSteps"
      @update:open="(open) => !open && (correcting = null)"
    />
    <SettingsDialog
      :open="menu.overlay.value === 'settings'"
      @update:open="menu.show('settings')($event)"
      @back="menu.back"
    />
    <DevPanel
      v-if="devMode && snapshot"
      class="scene-view__dev-panel"
      :hour="snapshot.hour"
      :playing="snapshot.auto"
      :day-length-minutes="DAY_LENGTHS_MINUTES[dayLengthIndex] ?? 2"
      :biome="snapshot.biome"
      :biome-ids="biomeIds"
      :level="snapshot.level"
      :levels="levels"
      :beard-day="beardDay"
      :collapsed="devPanelCollapsed"
      :behaviours="behaviours"
      :api-weather="apiWeather"
      :weather="sceneWeather"
      :weather-from-api="handWeather === null"
      @update:weather="(next) => (handWeather = next)"
      @follow-api-weather="handWeather = null"
      @select-level="(level) => scene?.setLevel(level)"
      @update:collapsed="devPanelCollapsed = $event"
      @update:beard-day="beardDayOverride = $event"
      @update:hour="setHour"
      @toggle-play="togglePlay"
      @now="backToNow"
      @cycle-day-length="cycleDayLength"
      @select-biome="(id) => scene?.setBiome(id)"
      @reseed="scene?.reseed()"
      @trigger="(id) => scene?.trigger(id)"
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
