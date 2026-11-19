<script setup lang="ts">
import { computed } from 'vue';
import { distanceKm } from '@shared/steps/dailyWalk';
import { arrivalDate, journeyDays } from '@shared/steps/journey';
import { t, tn } from '@/shared/i18n';

export interface Props {
  lengthKm: number;
  dailySteps: number;
  /** The day the journey starts; injected so the summary is the same in tests and on screen. */
  startDate: Date;
}

defineOptions({ name: 'JourneySummary' });
const props = defineProps<Props>();

// Below about two months a month count says little, so only days are shown.
const MONTHS_FROM_DAYS = 60;
const DAYS_PER_MONTH = 30.44;

const days = computed(() => journeyDays(props.lengthKm, props.dailySteps));
const daily = computed(() =>
  t('plan.dailyDistance', { km: distanceKm(props.dailySteps).toLocaleString('pl-PL', { maximumFractionDigits: 1 }) }),
);
const duration = computed(() =>
  days.value < MONTHS_FROM_DAYS
    ? t('plan.duration', { days: tn('unit.days', days.value) })
    : t('plan.durationLong', {
        days: tn('unit.days', days.value),
        months: tn('unit.months', Math.round(days.value / DAYS_PER_MONTH)),
      }),
);
const arrival = computed(() =>
  t('plan.arrival', {
    date: arrivalDate(props.startDate, days.value).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }),
  }),
);
</script>

<template>
  <div class="journey-summary">
    <p class="journey-summary__line" data-testid="summary-daily">{{ daily }}</p>
    <p class="journey-summary__line journey-summary__line--main" data-testid="summary-duration">{{ duration }}</p>
    <p class="journey-summary__line" data-testid="summary-arrival">{{ arrival }}</p>
  </div>
</template>

<style scoped>
.journey-summary {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: var(--space-3);
  border-radius: 12px;
  background: var(--paper-deep);
}
.journey-summary__line {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-dim);
}
.journey-summary__line--main {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--ink);
}
</style>
