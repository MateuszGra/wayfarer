<script setup lang="ts">
import { BaseInput } from '@/design-system';

export interface Props {
  id: string;
  label: string;
  modelValue: string;
  type?: 'text' | 'email' | 'password';
  autocomplete?: string;
  error?: string | null;
}

defineOptions({ name: 'FormField' });
withDefaults(defineProps<Props>(), { type: 'text', autocomplete: 'off', error: null });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <div class="form-field">
    <label class="form-field__label" :for="id">{{ label }}</label>
    <BaseInput
      :id="id"
      :model-value="modelValue"
      :type="type"
      :autocomplete="autocomplete"
      :invalid="error !== null"
      :described-by="error ? `${id}-error` : undefined"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <p v-if="error" :id="`${id}-error`" class="form-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.form-field {
  display: grid;
  gap: var(--space-1);
}
.form-field__label {
  font-size: var(--text-sm);
  color: var(--ink-dim);
}
.form-field__error {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--rust-deep);
}
</style>
