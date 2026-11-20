<script setup lang="ts">
import { computed } from 'vue';
import { journeyDays } from '@shared/steps/journey';
import { t, tn, type TranslationKey } from '@/shared/i18n';

export interface Props {
  routeId: string;
  lengthKm: number;
  doneKm: number;
  dailySteps: number;
  /** What today's steps added, in km; 0 hides the line. */
  todayKm?: number;
}

defineOptions({ name: 'JourneyProgress' });
const props = withDefaults(defineProps<Props>(), { todayKm: 0 });

const km = (value: number): string => value.toLocaleString('pl-PL', { maximumFractionDigits: 0 });
const leftKm = computed(() => Math.max(0, props.lengthKm - props.doneKm));
const percent = computed(() => Math.min(100, Math.floor((props.doneKm / props.lengthKm) * 100)));
const summary = computed(() =>
  t('map.progress', { done: km(props.doneKm), total: km(props.lengthKm), percent: percent.value }),
);
const atGoal = computed(() =>
  leftKm.value > 0
    ? t('map.atGoal', {
        steps: tn('unit.steps', props.dailySteps),
        days: tn('unit.days', journeyDays(leftKm.value, props.dailySteps)),
      })
    : null,
);
</script>

<template>
  <section class="journey-progress">
    <h2 class="journey-progress__title">{{ t(`route.${routeId}` as TranslationKey) }}</h2>
    <div class="journey-progress__bar" aria-hidden="true">
      <div class="journey-progress__fill" :style="{ width: `${percent}%` }" />
    </div>
    <p class="journey-progress__main" data-testid="progress-summary">{{ summary }}</p>
    <p v-if="todayKm > 0" class="journey-progress__today" data-testid="progress-today">
      {{ t('map.today', { km: todayKm.toLocaleString('pl-PL', { maximumFractionDigits: 1 }) }) }}
    </p>
    <p class="journey-progress__line" data-testid="progress-left">{{ t('map.left', { km: km(leftKm) }) }}</p>
    <p v-if="atGoal" class="journey-progress__line" data-testid="progress-at-goal">{{ atGoal }}</p>
  </section>
</template>

<style scoped>
.journey-progress__today {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--rust);
}
.journey-progress__title {
  margin: 0 0 var(--space-2);
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.25;
}
.journey-progress__bar {
  height: 4px;
  border-radius: 2px;
  background: var(--paper-deep);
  overflow: hidden;
}
.journey-progress__fill {
  height: 100%;
  background: var(--rust);
}
.journey-progress__main {
  margin: var(--space-2) 0 var(--space-1);
  font-size: var(--text-sm);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.journey-progress__line {
  margin: 0;
  font-size: 12px;
  color: var(--ink-dim);
}
</style>
