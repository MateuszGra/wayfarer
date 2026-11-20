<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BaseIconButton } from '@/design-system';
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
// The planner covers part of the map (the bottom on a phone, the right side on a wider screen); the route
// is framed in the part left free.
const panel = ref<HTMLElement | null>(null);
const panelHeight = ref(0);
const panelWidth = ref(440);
let panelObserver: ResizeObserver | null = null;
onMounted(() => {
  if (!panel.value) return;
  panelObserver = new ResizeObserver(() => {
    if (wide) panelWidth.value = (panel.value?.offsetWidth ?? 400) + 40;
    else panelHeight.value = panel.value?.offsetHeight ?? 0;
  });
  panelObserver.observe(panel.value);
});
onBeforeUnmount(() => panelObserver?.disconnect());
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
    <!-- Only when changing a planned journey: the first plan has nowhere to go back to. It sits in the
         screen's top-left corner rather than on the planner, which on a phone covers the bottom. -->
    <BaseIconButton
      v-if="changing"
      class="start-view__back"
      :label="t('plan.back')"
      data-testid="plan-back"
      @click="back"
    >
      <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <path
          d="M12 4l-6 6 6 6"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </BaseIconButton>
    <RouteMap :path="selectedPath" :padding-right="wide ? panelWidth : 0" :padding-bottom="panelHeight" />
    <div ref="panel" class="start-view__panel">
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
  left: var(--space-2);
  right: var(--space-2);
  bottom: max(var(--space-2), env(safe-area-inset-bottom));
  display: grid;
  justify-items: center;
  gap: var(--space-2);
}
/* Only on a very short screen does the planner scroll inside, still leaving the top of the map in view;
   otherwise it must not scroll, which would clip its rounded corners and shadow. */
@media (max-height: 340px) {
  .start-view__panel {
    max-height: calc(100dvh - 2 * var(--space-2));
    overflow-y: auto;
  }
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
.start-view__back {
  position: absolute;
  z-index: 1;
  top: max(var(--space-4), env(safe-area-inset-top));
  left: max(var(--gutter), env(safe-area-inset-left));
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
