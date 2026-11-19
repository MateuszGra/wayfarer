<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { t } from '@/shared/i18n';
import RouteMap from '@/shared/components/organisms/RouteMap/RouteMap.vue';
import RoutePlanner from '../components/organisms/RoutePlanner/RoutePlanner.vue';
import { usePlan } from '@/shared/composables/usePlan';
import { useRoutes } from '@/shared/composables/useRoutes';

defineOptions({ name: 'StartView' });

const router = useRouter();
const { routes, error } = useRoutes();
const { routeId, dailySteps } = usePlan();
const today = new Date();
const wide = window.matchMedia('(min-width: 720px)').matches;

// With a single route on offer there is nothing to choose yet, so it is preselected.
watch(routes, (list) => {
  if (!routeId.value && list.length === 1 && list[0]) routeId.value = list[0].id;
});
const selectedPath = computed(() => routes.value.find((route) => route.id === routeId.value)?.path ?? null);

// Synchronising steps comes next; until that screen exists the plan leads straight into the game.
const start = (): void => void router.push('/scene');
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
        @continue="start"
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
