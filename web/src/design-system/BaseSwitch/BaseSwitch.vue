<script setup lang="ts">
import { useId } from 'vue';
import { SwitchRoot, SwitchThumb } from 'reka-ui';

export interface Props {
  modelValue: boolean;
  /** The visible name of the setting, also the switch's accessible name. */
  label: string;
  /** A line under the label saying what the setting does. */
  description?: string | undefined;
  disabled?: boolean;
}

defineOptions({ name: 'BaseSwitch' });
withDefaults(defineProps<Props>(), { description: undefined, disabled: false });
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const id = useId();
</script>

<template>
  <div class="base-switch">
    <div class="base-switch__text">
      <label class="base-switch__label" :for="id">{{ label }}</label>
      <p v-if="description" :id="`${id}-description`" class="base-switch__description">{{ description }}</p>
    </div>
    <SwitchRoot
      :id="id"
      class="base-switch__control"
      :model-value="modelValue"
      :disabled="disabled"
      :aria-describedby="description ? `${id}-description` : undefined"
      @update:model-value="emit('update:modelValue', $event)"
    >
      <SwitchThumb class="base-switch__thumb" />
    </SwitchRoot>
  </div>
</template>

<style scoped>
.base-switch {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
}
.base-switch__text {
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}
.base-switch__label {
  font-weight: 600;
  color: var(--ink);
  cursor: pointer;
}
.base-switch__description {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-dim);
}
.base-switch__control {
  position: relative;
  flex: none;
  width: 44px;
  height: 26px;
  padding: 0;
  border: 2px solid var(--ink);
  border-radius: var(--radius-pill);
  background: var(--paper-line);
  cursor: pointer;
  transition: background 0.15s;
}
.base-switch__control[data-state='checked'] {
  background: var(--pine);
}
.base-switch__control[data-disabled] {
  opacity: 0.5;
  cursor: default;
}
.base-switch__control:focus-visible {
  outline: 2px solid var(--rust);
  outline-offset: 2px;
}
.base-switch__thumb {
  display: block;
  width: 18px;
  height: 18px;
  margin-left: 2px;
  border-radius: 50%;
  background: var(--paper);
  transition: transform 0.15s;
}
.base-switch__thumb[data-state='checked'] {
  transform: translateX(18px);
}
@media (prefers-reduced-motion: reduce) {
  .base-switch__control,
  .base-switch__thumb {
    transition: none;
  }
}
</style>
