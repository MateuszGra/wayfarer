<script setup lang="ts">
import { computed } from 'vue';
import type { RouteSummaryDto } from '@shared/api/contracts';
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
}

defineOptions({ name: 'RoutePlanner' });
const props = defineProps<Props>();
const emit = defineEmits<{ 'update:routeId': [id: string]; 'update:dailySteps': [steps: number]; continue: [] }>();

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
      :min="3000"
      :max="25000"
      :step="500"
      @update:model-value="emit('update:dailySteps', $event)"
    />

    <JourneySummary v-if="selected" :length-km="selected.lengthKm" :daily-steps="dailySteps" :start-date="startDate" />

    <BaseButton variant="ink" block :disabled="!selected" data-testid="plan-continue" @click="emit('continue')">
      {{ t('plan.continue') }}
    </BaseButton>
  </BaseCard>
</template>

<style scoped>
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
