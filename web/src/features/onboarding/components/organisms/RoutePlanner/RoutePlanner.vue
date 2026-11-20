<script setup lang="ts">
import { computed } from 'vue';
import type { RouteSummaryDto } from '@shared/api/contracts';
import { DAILY_GOAL } from '@shared/journey/rules';
import { BaseButton, BaseCard, BaseIconButton } from '@/design-system';
import { t } from '@/shared/i18n';
import JourneySummary from '../../molecules/JourneySummary/JourneySummary.vue';
import RouteOption from '../../molecules/RouteOption/RouteOption.vue';
import StepGoal from '../../molecules/StepGoal/StepGoal.vue';

export interface Props {
  routes: readonly RouteSummaryDto[];
  routeId: string | null;
  dailySteps: number;
  startDate: Date;
  /** The plan is being saved; the button waits instead of sending twice. */
  pending?: boolean;
  /** What the server said went wrong, already in the player's words. */
  error?: string | null;
  /** Changing a planned journey from the settings rather than planning the first one. */
  changing?: boolean;
}

defineOptions({ name: 'RoutePlanner' });
const props = withDefaults(defineProps<Props>(), { pending: false, error: null, changing: false });
const emit = defineEmits<{
  'update:routeId': [id: string];
  'update:dailySteps': [steps: number];
  continue: [];
  back: [];
}>();

const selected = computed(() => props.routes.find((route) => route.id === props.routeId) ?? null);
</script>

<template>
  <BaseCard class="route-planner">
    <!-- Only when changing a planned journey: the first plan has nowhere to go back to. -->
    <BaseIconButton
      v-if="changing"
      class="route-planner__back"
      :label="t('plan.back')"
      data-testid="plan-back"
      @click="emit('back')"
    >
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
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
    <h1 class="route-planner__title">{{ t('plan.title') }}</h1>

    <section class="route-planner__section">
      <h2 class="route-planner__heading">{{ t('plan.route') }}</h2>
      <div role="radiogroup" :aria-label="t('plan.route')" class="route-planner__routes">
        <RouteOption
          v-for="route in routes"
          :key="route.id"
          :route-id="route.id"
          :length-km="route.lengthKm"
          :selected="route.id === routeId"
          @select="emit('update:routeId', route.id)"
        />
      </div>
    </section>

    <StepGoal
      class="route-planner__section"
      :model-value="dailySteps"
      :min="DAILY_GOAL.min"
      :max="DAILY_GOAL.max"
      :step="DAILY_GOAL.step"
      @update:model-value="emit('update:dailySteps', $event)"
    />

    <JourneySummary v-if="selected" :length-km="selected.lengthKm" :daily-steps="dailySteps" :start-date="startDate" />

    <p v-if="error" class="route-planner__error" role="alert" data-testid="plan-error">{{ error }}</p>
    <BaseButton
      variant="ink"
      block
      :disabled="!selected || pending"
      data-testid="plan-continue"
      @click="emit('continue')"
    >
      {{ changing ? t('plan.saveChanges') : t('plan.continue') }}
    </BaseButton>
  </BaseCard>
</template>

<style scoped>
.route-planner {
  position: relative;
}
.route-planner__back {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  width: 36px;
  height: 36px;
  box-shadow: none;
}
.route-planner__error {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--rust-deep);
}
.route-planner {
  width: min(400px, calc(100vw - 2 * var(--space-4)));
}
.route-planner__title {
  margin: 0 0 var(--space-4);
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: center;
}
.route-planner__section {
  margin-bottom: var(--space-4);
}
.route-planner__heading {
  margin: 0 0 var(--space-2);
  font-size: var(--text-sm);
  font-weight: 400;
  color: var(--ink-dim);
}
.route-planner__routes {
  display: grid;
  gap: var(--space-2);
}
.route-planner :deep(.journey-summary) {
  margin-bottom: var(--space-4);
}
</style>
