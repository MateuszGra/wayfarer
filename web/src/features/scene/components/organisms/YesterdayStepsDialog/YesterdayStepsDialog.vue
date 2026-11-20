<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CONFIRM_STEPS_ABOVE, isDayOfSteps } from '@shared/journey/rules';
import { distanceKm } from '@shared/steps/dailyWalk';
import { BaseButton, BaseDialog } from '@/design-system';
import FormField from '@/shared/components/molecules/FormField/FormField.vue';
import { t } from '@/shared/i18n';

export interface Props {
  open: boolean;
  /** Day on the road the steps will be walked on. */
  day: number;
  /** The date the steps were walked, `YYYY-MM-DD`. */
  stepsDate: string;
  /** Correcting steps already entered: the window can be closed and starts with them filled in. */
  correcting?: number | null;
  pending?: boolean;
  /** What the server said went wrong, already in the player's words. */
  error?: string | null;
}

defineOptions({ name: 'YesterdayStepsDialog' });
const props = withDefaults(defineProps<Props>(), { correcting: null, pending: false, error: null });
const emit = defineEmits<{ submit: [steps: number]; 'update:open': [open: boolean] }>();

const typed = ref('');
const confirming = ref(false);
const invalid = ref(false);
watch(
  () => props.open,
  (open) => {
    if (!open) return;
    typed.value = props.correcting === null ? '' : String(props.correcting);
    confirming.value = false;
    invalid.value = false;
  },
  { immediate: true },
);
watch(typed, () => {
  confirming.value = false;
  invalid.value = false;
});

// Spaces are allowed, so "8 500" reads as 8500; anything else that isn't a digit makes it invalid.
const steps = computed(() => {
  const digits = typed.value.replace(/\s/g, '');
  return /^\d+$/.test(digits) ? Number(digits) : null;
});
const dateLabel = computed(() =>
  new Date(`${props.stepsDate}T12:00:00`).toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }),
);
const fmt = (n: number, digits = 0): string => n.toLocaleString('pl-PL', { maximumFractionDigits: digits });
// Only the distance the steps stand for, as the player types: showing how long the traveller would walk
// would tempt people to add a few steps.
const preview = computed(() => {
  const value = steps.value;
  if (value === null || !isDayOfSteps(value)) return null;
  return t('steps.preview', { km: fmt(distanceKm(value), 1) });
});

const submit = (): void => {
  const value = steps.value;
  if (value === null || !isDayOfSteps(value)) {
    invalid.value = true;
    return;
  }
  // A big number is most likely a typo, so it is saved only once the player confirms it.
  if (value > CONFIRM_STEPS_ABOVE && !confirming.value) {
    confirming.value = true;
    return;
  }
  emit('submit', value);
};
// Until today's steps are in, the window can't be closed: the day can't start without them.
const onOpen = (open: boolean): void => {
  if (props.correcting !== null) emit('update:open', open);
};
</script>

<template>
  <BaseDialog
    :open="open"
    :title="t('steps.title')"
    hide-title
    :escape-closes="correcting !== null"
    :close-label="correcting !== null ? t('steps.close') : undefined"
    @update:open="onOpen"
  >
    <form class="yesterday-steps" novalidate @submit.prevent="submit">
      <p class="yesterday-steps__day">{{ t('steps.day', { day, date: dateLabel }) }}</p>
      <h2 class="yesterday-steps__question">
        {{ t('steps.questionBefore') }} <em class="yesterday-steps__yesterday">{{ t('steps.yesterday') }}</em>?
      </h2>
      <FormField
        id="yesterday-steps"
        v-model="typed"
        inputmode="numeric"
        :label="t('steps.label')"
        :hint="preview"
        :error="invalid ? t('errors.invalid_steps') : error"
        data-testid="yesterday-steps-input"
      />
      <p v-if="confirming" class="yesterday-steps__confirm" role="alert" data-testid="yesterday-steps-confirm">
        {{ t('steps.confirm', { steps: fmt(steps ?? 0) }) }}
      </p>
      <BaseButton type="submit" variant="ink" block :disabled="pending" data-testid="yesterday-steps-submit">
        {{ confirming ? t('steps.confirmSubmit') : t('steps.submit') }}
      </BaseButton>
    </form>
  </BaseDialog>
</template>

<style scoped>
.yesterday-steps {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-3);
}
.yesterday-steps__day {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-dim);
  text-align: center;
}
.yesterday-steps__question {
  margin: 0 0 var(--space-2);
  font-family: var(--font-display);
  font-size: 24px;
  text-align: center;
  color: var(--ink);
}
/* "Yesterday" stands out, so nobody enters today's steps in the evening by mistake. */
.yesterday-steps__yesterday {
  font-style: normal;
  color: var(--rust);
  text-decoration: underline;
  text-decoration-thickness: 3px;
  text-underline-offset: 4px;
}
.yesterday-steps__confirm {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--rust-deep);
}
</style>
