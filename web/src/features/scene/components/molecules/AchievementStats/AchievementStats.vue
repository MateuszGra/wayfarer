<script setup lang="ts">
import type { HistorySummary } from '@shared/steps/history';
import { t } from '@/shared/i18n';

export interface Props {
  summary: HistorySummary;
}

defineOptions({ name: 'AchievementStats' });
defineProps<Props>();

const number = (value: number, digits = 0): string => value.toLocaleString('pl-PL', { maximumFractionDigits: digits });
</script>

<template>
  <dl class="achievement-stats">
    <div class="achievement-stats__item">
      <dt>{{ t('achievements.days') }}</dt>
      <dd data-testid="stats-days">{{ number(summary.days) }}</dd>
    </div>
    <div class="achievement-stats__item">
      <dt>{{ t('achievements.goals') }}</dt>
      <dd data-testid="stats-goals">
        {{ t('achievements.goalsValue', { reached: summary.goalsReached, days: summary.days }) }}
      </dd>
    </div>
    <div class="achievement-stats__item">
      <dt>{{ t('achievements.steps') }}</dt>
      <dd data-testid="stats-steps">{{ number(summary.totalSteps) }}</dd>
    </div>
    <div class="achievement-stats__item">
      <dt>{{ t('achievements.distance') }}</dt>
      <dd data-testid="stats-km">{{ number(summary.totalKm, 1) }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.achievement-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-2);
  margin: 0;
}
.achievement-stats__item {
  padding: var(--space-3);
  border-radius: 10px;
  background: var(--paper-deep);
}
.achievement-stats__item dt {
  font-size: 12px;
  color: var(--ink-dim);
}
.achievement-stats__item dd {
  margin: var(--space-1) 0 0;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
/* A small phone, either way up: smaller tiles, so the journal below them has room. */
@media (max-width: 420px), (max-height: 460px) {
  .achievement-stats__item {
    padding: var(--space-2);
  }
  .achievement-stats__item dd {
    font-size: 18px;
  }
}
</style>
