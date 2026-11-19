<script setup lang="ts">
import { computed } from 'vue';
import { distanceKm } from '@shared/steps/dailyWalk';
import type { DayOutcome } from '@shared/steps/history';
import { t, tn } from '@/shared/i18n';
import DayStamp from '../../atoms/DayStamp/DayStamp.vue';

export interface Props {
  day: number;
  /** `YYYY-MM-DD` */
  date: string;
  steps: number;
  goal: number;
  outcome: DayOutcome;
}

defineOptions({ name: 'AchievementDay' });
const props = defineProps<Props>();

const dateLabel = computed(() => {
  const [year, month, day] = props.date.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1).toLocaleDateString('pl-PL', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
});
// On a missed day the note encourages instead of judging: how much of the goal was walked.
const note = computed(() =>
  props.outcome === 'missed'
    ? t('achievements.outcome.missed', { percent: Math.floor((props.steps / props.goal) * 100) })
    : t(`achievements.outcome.${props.outcome}`),
);
const km = computed(() => `${distanceKm(props.steps).toLocaleString('pl-PL', { maximumFractionDigits: 1 })} km`);
</script>

<template>
  <li class="achievement-day" :class="`achievement-day--${outcome}`" :data-testid="`day-${day}`">
    <div class="achievement-day__when">
      <span class="achievement-day__number">{{ t('achievements.day', { day }) }}</span>
      <span class="achievement-day__date">{{ dateLabel }}</span>
    </div>
    <div class="achievement-day__steps">
      <span>{{ tn('unit.steps', steps) }}</span>
      <span class="achievement-day__km">{{ km }}</span>
    </div>
    <div class="achievement-day__mark">
      <DayStamp :outcome="outcome" :day="day" />
      <span class="achievement-day__note" data-testid="day-outcome">{{ note }}</span>
    </div>
  </li>
</template>

<style scoped>
.achievement-day {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3);
  border-bottom: 1px solid var(--paper-line);
}
.achievement-day__when,
.achievement-day__steps {
  display: grid;
}
.achievement-day__number {
  font-weight: 600;
}
.achievement-day__date,
.achievement-day__km {
  font-size: 12px;
  color: var(--ink-dim);
}
.achievement-day__steps {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.achievement-day__mark {
  display: grid;
  justify-items: center;
  gap: 2px;
  width: 104px;
}
.achievement-day__note {
  font-size: 11px;
  text-align: center;
  color: var(--ink-dim);
}
.achievement-day--reached .achievement-day__note {
  color: var(--rust-deep);
  font-weight: 600;
}
@media (max-width: 560px) {
  .achievement-day {
    grid-template-columns: 1fr auto;
  }
  .achievement-day__mark {
    grid-row: span 2;
  }
}
</style>
