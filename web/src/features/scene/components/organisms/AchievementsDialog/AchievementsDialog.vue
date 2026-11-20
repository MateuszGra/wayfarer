<script setup lang="ts">
import { computed, ref } from 'vue';
import { trophyProgress } from '@shared/achievements/trophies';
import { dayOutcome, summarize } from '@shared/steps/history';
import { BaseDialog, BaseTabs } from '@/design-system';
import { usePlan } from '@/shared/composables/usePlan';
import { useStepHistory } from '@/shared/composables/useStepHistory';
import { t } from '@/shared/i18n';
import AchievementDay from '../../molecules/AchievementDay/AchievementDay.vue';
import AchievementStats from '../../molecules/AchievementStats/AchievementStats.vue';
import TrophyCard from '../../molecules/TrophyCard/TrophyCard.vue';

export interface Props {
  open: boolean;
}

defineOptions({ name: 'AchievementsDialog' });
defineProps<Props>();
const emit = defineEmits<{ 'update:open': [open: boolean]; back: [] }>();

const { history } = useStepHistory();
// Each day is judged against the current goal until the goal history is stored on the server.
const { dailySteps } = usePlan();
const summary = computed(() => summarize(history.value, dailySteps.value));
const newestFirst = computed(() => [...history.value].reverse());
const trophies = computed(() => trophyProgress(summary.value.totalSteps));
const wonCount = computed(() => trophies.value.filter((trophy) => trophy.won).length);

type Tab = 'journal' | 'trophies';
const tab = ref<Tab>('journal');
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
            {{ t('trophies.count', { won: wonCount, all: trophies.length }) }}
          </p>
          <ul class="achievements__trophies" :aria-label="t('trophies.list')">
            <TrophyCard v-for="trophy in trophies" :key="trophy.id" :trophy="trophy" />
          </ul>
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
.achievements__count {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-dim);
  text-align: center;
}
.achievements__trophies {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: var(--space-3);
  align-content: start;
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
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
