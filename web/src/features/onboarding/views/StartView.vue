<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiErrorMessage } from '@/shared/api/errorMessages';
import { t } from '@/shared/i18n';
import RouteMap from '@/shared/components/organisms/RouteMap/RouteMap.vue';
import RoutePlanner from '../components/organisms/RoutePlanner/RoutePlanner.vue';
import { returnToOverlay } from '@/shared/composables/useGameMenu';
import { useJourney } from '@/shared/composables/useJourney';
import { useRoutes } from '@/shared/composables/useRoutes';

defineOptions({ name: 'StartView' });

const DEFAULT_DAILY_STEPS = 10_000;
const router = useRouter();
// Reached from the settings with `?change` to change a planned journey; otherwise it plans the first one.
const changing = 'change' in useRoute().query;
const { routes, error } = useRoutes();
const journey = useJourney();
const routeId = ref<string | null>(journey.journey.value?.journey.routeId ?? null);
const dailySteps = ref(journey.journey.value?.journey.dailySteps ?? DEFAULT_DAILY_STEPS);
const today = new Date();
const wide = window.matchMedia('(min-width: 720px)').matches;
const pending = ref(false);
const saveError = ref<string | null>(null);

// With a single route on offer there is nothing to choose yet, so it is preselected.
watch(routes, (list) => {
  if (!routeId.value && list.length === 1 && list[0]) routeId.value = list[0].id;
});
const selectedPath = computed(() => routes.value.find((route) => route.id === routeId.value)?.path ?? null);

// Changing nothing after all: back to the game, to the settings the player came from.
const back = (): void => {
  returnToOverlay('settings');
  void router.push('/scene');
};

const start = async (): Promise<void> => {
  if (!routeId.value || pending.value) return;
  pending.value = true;
  saveError.value = null;
  try {
    await (changing ? journey.change(routeId.value, dailySteps.value) : journey.plan(routeId.value, dailySteps.value));
    await router.push('/scene');
  } catch (failure) {
    saveError.value = apiErrorMessage(failure);
  } finally {
    pending.value = false;
  }
};
</script>

<template>
  <main class="start-view">
    <RouteMap :path="selectedPath" :padding-right="wide ? 440 : 0" />
    <div class="start-view__panel">
      <p v-if="error" class="start-view__error" role="alert">{{ t(error) }}</p>
      <RoutePlanner
        v-model:route-id="routeId"
        v-model:daily-steps="dailySteps"
        :routes="routes"
        :start-date="today"
        :pending="pending"
        :error="saveError"
        :changing="changing"
        @continue="start"
        @back="back"
      />
    </div>
  </main>
</template>

<style scoped>
.start-view {
  position: absolute;
  inset: 0;
}
.start-view__panel {
  position: absolute;
  left: var(--space-4);
  right: var(--space-4);
  bottom: max(var(--space-4), env(safe-area-inset-bottom));
  display: grid;
  justify-items: center;
  gap: var(--space-2);
}
@media (min-width: 720px) {
  .start-view__panel {
    left: auto;
    right: var(--gutter);
    top: 50%;
    bottom: auto;
    transform: translateY(-50%);
  }
}
.start-view__error {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border-radius: 10px;
  background: var(--paper);
  color: var(--rust-deep);
  font-size: var(--text-sm);
}
</style>
