<script setup lang="ts">
export interface Props {
  id: string;
  modelValue: string;
  type?: 'text' | 'email' | 'password';
  autocomplete?: string;
  invalid?: boolean;
  describedBy?: string | undefined;
}

defineOptions({ name: 'BaseInput' });
withDefaults(defineProps<Props>(), { type: 'text', autocomplete: 'off', invalid: false, describedBy: undefined });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <input
    :id="id"
    class="base-input"
    :class="{ 'base-input--invalid': invalid }"
    :type="type"
    :value="modelValue"
    :autocomplete="autocomplete"
    :aria-invalid="invalid"
    :aria-describedby="describedBy"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<style scoped>
.base-input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: var(--space-2) var(--space-3);
  font: inherit;
  font-size: var(--text-md);
  color: var(--ink);
  background: var(--paper-deep);
  border: 1px solid var(--paper-line);
  border-radius: 10px;
}
.base-input:focus-visible {
  outline: 2px solid var(--rust);
  outline-offset: 1px;
}
.base-input--invalid {
  border-color: var(--rust);
}
</style>
