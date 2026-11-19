<script setup lang="ts">
import { BaseSlider } from '@/design-system';
import { t, tn } from '@/shared/i18n';

export interface Props {
  modelValue: number;
  min: number;
  max: number;
  step: number;
}

defineOptions({ name: 'StepGoal' });
defineProps<Props>();
const emit = defineEmits<{ 'update:modelValue': [steps: number] }>();
</script>

<template>
  <div class="step-goal">
    <div class="step-goal__header">
      <span class="step-goal__label">{{ t('plan.goal') }}</span>
      <span class="step-goal__value" data-testid="step-goal-value">{{ tn('unit.steps', modelValue) }}</span>
    </div>
    <BaseSlider
      :model-value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :label="t('plan.goal')"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>

<style scoped>
.step-goal {
  display: grid;
  gap: var(--space-2);
}
.step-goal__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.step-goal__label {
  font-size: var(--text-sm);
  color: var(--ink-dim);
}
.step-goal__value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
