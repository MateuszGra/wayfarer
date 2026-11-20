<script setup lang="ts">
import { computed } from 'vue';
import { dayOutcome, summarize } from '@shared/steps/history';
import { BaseDialog } from '@/design-system';
import { usePlan } from '@/shared/composables/usePlan';
import { useStepHistory } from '@/shared/composables/useStepHistory';
import { t } from '@/shared/i18n';
import AchievementDay from '../../molecules/AchievementDay/AchievementDay.vue';
import AchievementStats from '../../molecules/AchievementStats/AchievementStats.vue';

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
