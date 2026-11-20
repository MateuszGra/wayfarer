<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { dayOutcome } from '@shared/steps/history';
import { BaseButton, BaseDialog, BaseTabs } from '@/design-system';
import { useJourney } from '@/shared/composables/useJourney';
import { t } from '@/shared/i18n';
import AchievementDay from '../../molecules/AchievementDay/AchievementDay.vue';
import AchievementStats from '../../molecules/AchievementStats/AchievementStats.vue';
import TrophyCard from '../../molecules/TrophyCard/TrophyCard.vue';
import { useTrophies } from '../../../composables/useTrophies';

export interface Props {
  open: boolean;
  /** The tab shown each time the window opens: the journal, or the trophies (after a trophy is won). */
  startTab?: 'journal' | 'trophies';
}

defineOptions({ name: 'AchievementsDialog' });
const props = withDefaults(defineProps<Props>(), { startTab: 'journal' });
const emit = defineEmits<{ 'update:open': [open: boolean]; back: []; 'correct-steps': [] }>();

const journey = useJourney();
const { history, dailySteps, summary, road, world, all: allTrophies } = useTrophies();
// Won trophies come first in each list, the rest keep their order from the closest to the furthest.
const wonFirst = <T extends { readonly won: boolean }>(list: readonly T[]): T[] => [
  ...list.filter((trophy) => trophy.won),
  ...list.filter((trophy) => !trophy.won),
];
const trophies = computed(() => wonFirst(road.value));
const worldTrophies = computed(() => wonFirst(world.value));
// Yesterday's steps can be corrected until midnight, from here.
const enteredToday = computed(() => journey.journey.value?.today.stepsEntered ?? null);
const newestFirst = computed(() => [...history.value].reverse());
const wonCount = computed(() => allTrophies.value.filter((trophy) => trophy.won).length);

type Tab = 'journal' | 'trophies';
const tab = ref<Tab>(props.startTab);
watch(
  () => props.open,
  (open) => {
    if (open) tab.value = props.startTab;
  },
);
// Line icons for the tabs: an open book for the journal, a cup for the trophies.
const BOOK_ICON = 'M3 4.5C5.5 3.5 8 3.8 10 5c2-1.2 4.5-1.5 7-.5v11c-2.5-1-5-.7-7 .5-2-1.2-4.5-1.5-7-.5ZM10 5v11';
const CUP_ICON =
  'M6 3.5h8v4c0 2.5-1.8 4-4 4s-4-1.5-4-4ZM6 5H3.5c0 2.5 1.3 3.6 2.8 3.6M14 5h2.5c0 2.5-1.3 3.6-2.8 3.6M10 11.5V14M7.5 14h5v2.5h-5Z';
const tabs = [
  { value: 'journal', label: t('achievements.tab.journal'), icon: BOOK_ICON },
  { value: 'trophies', label: t('achievements.tab.trophies'), icon: CUP_ICON },
] as const;
</script>

<template>
  <BaseDialog
    :open="open"
    :title="t('achievements.title')"
    size="wide"
    :escape-closes="false"
    :corner-close-label="t('achievements.close')"
    :back-label="t('menu.back')"
    @update:open="emit('update:open', $event)"
    @back="emit('back')"
  >
    <div class="achievements">
      <BaseTabs v-model="tab" :tabs="tabs" :label="t('achievements.tabs')">
        <template #journal>
          <AchievementStats :summary="summary" />
          <p v-if="enteredToday !== null" class="achievements__correct">
            {{ t('achievements.yesterdaySteps', { steps: enteredToday.toLocaleString('pl-PL') }) }}
            <BaseButton variant="link" data-testid="correct-steps" @click="emit('correct-steps')">
              {{ t('achievements.correctSteps') }}
            </BaseButton>
          </p>
          <ul class="achievements__days" :aria-label="t('achievements.list')">
            <AchievementDay
              v-for="entry in newestFirst"
              :key="entry.day"
              :day="entry.day"
              :date="entry.date"
              :steps="entry.steps"
              :goal="dailySteps"
              :outcome="dayOutcome(entry.steps, dailySteps)"
            />
          </ul>
        </template>
        <template #trophies>
          <p class="achievements__count" data-testid="trophies-count">
            {{ t('trophies.count', { won: wonCount, all: allTrophies.length }) }}
          </p>
          <div class="achievements__trophies">
            <ul class="achievements__trophy-list" :aria-label="t('trophies.list')">
              <TrophyCard v-for="trophy in trophies" :key="trophy.id" :trophy="trophy" />
            </ul>
            <h3 class="achievements__section">{{ t('trophies.world') }}</h3>
            <ul class="achievements__trophy-list" :aria-label="t('trophies.world')" data-testid="world-trophies">
              <TrophyCard v-for="trophy in worldTrophies" :key="trophy.id" :trophy="trophy" />
            </ul>
          </div>
        </template>
      </BaseTabs>
    </div>
  </BaseDialog>
</template>

<style scoped>
.achievements {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-height: 0;
  flex: 1;
}
.achievements__correct {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-dim);
}
.achievements__count {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-dim);
  text-align: center;
}
.achievements__trophies {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.achievements__trophy-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: var(--space-3);
  align-content: start;
  margin: 0;
  padding: 0;
  list-style: none;
}
.achievements__section {
  margin: var(--space-2) 0 0;
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--ink);
}
.achievements__days {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  border-top: 1px solid var(--paper-line);
}
</style>
