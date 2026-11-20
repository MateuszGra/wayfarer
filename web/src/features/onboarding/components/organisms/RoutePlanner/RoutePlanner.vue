<script setup lang="ts">
import { computed } from 'vue';
import type { RouteSummaryDto } from '@shared/api/contracts';
import { DAILY_GOAL } from '@shared/journey/rules';
import { BaseButton, BaseCard } from '@/design-system';
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
  /** Changing a planned journey from the settings rather than planning the first one (the button says so). */
  changing?: boolean;
}

defineOptions({ name: 'RoutePlanner' });
const props = withDefaults(defineProps<Props>(), { pending: false, error: null, changing: false });
const emit = defineEmits<{
  'update:routeId': [id: string];
  'update:dailySteps': [steps: number];
  continue: [];
}>();

const selected = computed(() => props.routes.find((route) => route.id === props.routeId) ?? null);
</script>

<template>
  <BaseCard class="route-planner">
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
/* On a phone, in portrait (a sheet over the bottom of the map) or in landscape (a low panel at the side),
   the planner keeps every control but drops the title and folds its lines together, so the map stays in
   view. The title stays for screen readers. */
@media (max-width: 719px), (max-height: 600px) {
  .route-planner :deep(.base-card__inner) {
    padding: var(--space-3) var(--space-4);
  }
  .route-planner__title,
  .route-planner__heading {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .route-planner__section,
  .route-planner :deep(.journey-summary) {
    margin-bottom: var(--space-3);
  }
  /* Grid and flex items grow to fit their text unless told otherwise; the long route name must shrink
     to an ellipsis instead of pushing the card past the screen edge. */
  .route-planner__routes {
    grid-template-columns: minmax(0, 1fr);
  }
  .route-planner :deep(.base-card__inner) > * {
    min-width: 0;
  }
  .route-planner :deep(.route-option) {
    min-width: 0;
    padding: var(--space-2) var(--space-3);
  }
  .route-planner :deep(.route-option__name) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .route-planner :deep(.step-goal) {
    gap: var(--space-1);
  }
  /* The duration on the first line, the daily distance and the arrival side by side below it; the arrival
     moves to its own line when the two don't fit. */
  .route-planner :deep(.journey-summary) {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    column-gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
  }
  .route-planner :deep(.journey-summary__line) {
    white-space: nowrap;
  }
  .route-planner :deep(.journey-summary__line--main) {
    flex-basis: 100%;
    order: -1;
    white-space: normal;
  }
}
@media (max-width: 719px) {
  .route-planner {
    width: 100%;
  }
}
@media (min-width: 720px) and (max-height: 600px) {
  .route-planner {
    width: 340px;
  }
}
</style>
