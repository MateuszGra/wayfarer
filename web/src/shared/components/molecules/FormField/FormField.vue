<script setup lang="ts">
import { computed } from 'vue';
import { BaseInput } from '@/design-system';

export interface Props {
  id: string;
  label: string;
  modelValue: string;
  type?: 'text' | 'email' | 'password';
  autocomplete?: string;
  error?: string | null;
  /** A rule shown under the field before anything goes wrong, e.g. the minimum password length. */
  hint?: string | null;
  inputmode?: 'text' | 'numeric';
}

defineOptions({ name: 'FormField' });
const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  autocomplete: 'off',
  error: null,
  hint: null,
  inputmode: 'text',
});
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const describedBy = computed(
  () =>
    [props.hint ? `${props.id}-hint` : null, props.error ? `${props.id}-error` : null].filter(Boolean).join(' ') ||
    undefined,
);
</script>

<template>
  <div class="form-field">
    <label class="form-field__label" :for="id">{{ label }}</label>
    <BaseInput
      :id="id"
      :model-value="modelValue"
      :type="type"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :invalid="error !== null"
      :described-by="describedBy"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <p v-if="hint" :id="`${id}-hint`" class="form-field__hint">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`" class="form-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.form-field {
  display: grid;
  /* Lets the input shrink to the panel: by default an input keeps its intrinsic width and can overflow. */
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-1);
}
.form-field__label {
  font-size: var(--text-sm);
  color: var(--ink-dim);
}
.form-field__hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-dim);
}
.form-field__error {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--rust-deep);
}
</style>
