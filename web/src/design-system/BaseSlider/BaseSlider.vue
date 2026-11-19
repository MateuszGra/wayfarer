<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui';

export interface Props {
  modelValue: number;
  min: number;
  max: number;
  step?: number;
  /** Accessible name of the slider thumb. */
  label: string;
}

defineOptions({ name: 'BaseSlider' });
withDefaults(defineProps<Props>(), { step: 1 });
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

const onUpdate = (values: number[] | undefined): void => {
  const [value] = values ?? [];
  if (value !== undefined) emit('update:modelValue', value);
};
</script>

<template>
  <SliderRoot
    class="base-slider"
    :model-value="[modelValue]"
    :min="min"
    :max="max"
    :step="step"
    @update:model-value="onUpdate"
  >
    <SliderTrack class="base-slider__track">
      <SliderRange class="base-slider__range" />
    </SliderTrack>
    <SliderThumb class="base-slider__thumb" :aria-label="label" />
  </SliderRoot>
</template>

<style scoped>
.base-slider {
  position: relative;
  display: flex;
  align-items: center;
  height: 24px;
  touch-action: none;
  user-select: none;
}
.base-slider__track {
  position: relative;
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--paper-line);
}
.base-slider__range {
  position: absolute;
  height: 100%;
  border-radius: 2px;
  background: var(--rust);
}
.base-slider__thumb {
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--paper);
  border: 2px solid var(--ink);
  cursor: grab;
}
.base-slider__thumb:focus-visible {
  outline: 2px solid var(--rust);
  outline-offset: 2px;
}
</style>
