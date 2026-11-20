<script setup lang="ts">
import { computed } from 'vue';
import type { TrophyProgress } from '@shared/achievements/trophies';
import { t, type TranslationKey } from '@/shared/i18n';
import TrophyIcon from '../../atoms/TrophyIcon/TrophyIcon.vue';

export interface Props {
  trophy: TrophyProgress;
}

defineOptions({ name: 'TrophyCard' });
const props = defineProps<Props>();

const name = computed(() => t(`trophy.${props.trophy.id}.name` as TranslationKey));
const description = computed(() => t(`trophy.${props.trophy.id}.description` as TranslationKey));
const percent = computed(() => Math.floor((props.trophy.done / props.trophy.goal) * 100));
const steps = (value: number): string => value.toLocaleString('pl-PL');
</script>

<template>
  <li class="trophy-card" :class="{ 'trophy-card--won': trophy.won }" :data-testid="`trophy-${trophy.id}`">
    <div class="trophy-card__medal">
      <TrophyIcon :id="trophy.id" />
    </div>
    <div class="trophy-card__text">
      <h4 class="trophy-card__name">{{ name }}</h4>
      <p class="trophy-card__description">{{ description }}</p>
      <p v-if="trophy.won" class="trophy-card__won">{{ t('trophy.won') }}</p>
      <p v-else-if="trophy.measure === 'sighting'" class="trophy-card__progress">{{ t('trophy.notSeen') }}</p>
      <template v-else>
        <div
          class="trophy-card__bar"
          role="progressbar"
          :aria-label="name"
          aria-valuemin="0"
          :aria-valuemax="trophy.goal"
          :aria-valuenow="trophy.done"
        >
          <div class="trophy-card__fill" :style="{ width: `${percent}%` }" />
        </div>
        <p class="trophy-card__progress">
          {{
            trophy.measure === 'streak'
              ? t('trophy.streakProgress', { done: trophy.done, goal: trophy.goal })
              : trophy.measure === 'species'
                ? t('trophy.speciesProgress', { done: trophy.done, goal: trophy.goal })
                : trophy.measure === 'days'
                  ? t('trophy.daysProgress', { done: trophy.done, goal: trophy.goal })
                  : trophy.measure === 'bestDay'
                    ? t('trophy.bestDayProgress', { done: steps(trophy.done), goal: steps(trophy.goal) })
                    : t('trophy.progress', { done: steps(trophy.done), goal: steps(trophy.goal) })
          }}
        </p>
      </template>
    </div>
  </li>
</template>

<style scoped>
.trophy-card {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3);
  background: var(--paper-deep);
  border-radius: 12px;
}
.trophy-card__medal {
  flex: none;
  width: 68px;
  height: 68px;
  padding: 3px;
  border: 3px solid var(--paper-line);
  border-radius: 50%;
  /* Not yet won: a faded silhouette, so the player can see what is still to come. */
  filter: grayscale(1);
  opacity: 0.5;
}
.trophy-card--won .trophy-card__medal {
  border-color: var(--sun);
  box-shadow:
    0 0 0 2px var(--paper-deep),
    0 0 0 4px var(--sun);
  filter: none;
  opacity: 1;
}
.trophy-card__text {
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}
.trophy-card__name {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-md);
  color: var(--ink);
}
.trophy-card__description {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-dim);
}
.trophy-card__won {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--pine);
}
.trophy-card__bar {
  height: 6px;
  margin-top: var(--space-1);
  overflow: hidden;
  background: var(--paper);
  border-radius: var(--radius-pill);
}
.trophy-card__fill {
  height: 100%;
  background: var(--rust);
}
.trophy-card__progress {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-dim);
  font-variant-numeric: tabular-nums;
}
/* A small phone: a smaller medal leaves the name and description more width. */
@media (max-width: 420px) {
  .trophy-card {
    gap: var(--space-2);
    padding: var(--space-2);
  }
  .trophy-card__medal {
    width: 52px;
    height: 52px;
  }
}
</style>
