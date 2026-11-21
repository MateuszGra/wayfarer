<script setup lang="ts">
import { computed } from 'vue';
import { PinInputInput, PinInputRoot } from 'reka-ui';

export interface Props {
  /** The digits typed so far, e.g. `482` or `482917`. */
  modelValue: string;
  /** How many digits the code has. */
  length?: number;
  /** A dash is drawn after every this many digits, as the code is written in the e-mail (`482-917`). */
  groupSize?: number;
  /** Id of the visible label that names the whole code. */
  labelledBy?: string | undefined;
  /** Accessible name of one box, e.g. "Cyfra 2 z 6"; Reka's own is in English. */
  digitLabel: (position: number, length: number) => string;
  invalid?: boolean;
  describedBy?: string | undefined;
  disabled?: boolean;
}

defineOptions({ name: 'BaseCodeInput' });
const props = withDefaults(defineProps<Props>(), {
  length: 6,
  groupSize: 3,
  labelledBy: undefined,
  invalid: false,
  describedBy: undefined,
  disabled: false,
});
const emit = defineEmits<{
  'update:modelValue': [value: string];
  /** Every box is filled: the whole code, as digits. */
  complete: [value: string];
}>();

// Reka keeps the code as numbers, one per box; the game passes it on as the string the player sees.
const digits = computed(() => [...props.modelValue].map(Number));
const asText = (value: (number | undefined)[]): string => value.map((digit) => digit ?? '').join('');

// Reka reports a full code again whenever v-model hands the same value back, so one paste would be
// reported twice and could be sent twice. A code is reported once, and again only after it was changed.
let reported: string | null = null;
const update = (value: (number | undefined)[]): void => {
  const code = asText(value);
  if (code !== reported) reported = null;
  emit('update:modelValue', code);
};
const complete = (value: (number | undefined)[]): void => {
  const code = asText(value);
  if (code === reported) return;
  reported = code;
  emit('complete', code);
};
</script>

<template>
  <PinInputRoot
    :model-value="digits"
    type="number"
    otp
    :disabled="disabled"
    class="base-code-input"
    role="group"
    :aria-labelledby="labelledBy"
    @update:model-value="update"
    @complete="complete"
  >
    <template v-for="position in length" :key="position">
      <PinInputInput
        :index="position - 1"
        class="base-code-input__digit"
        :class="{ 'base-code-input__digit--invalid': invalid }"
        :aria-label="digitLabel(position, length)"
        :aria-invalid="invalid"
        :aria-describedby="describedBy"
      />
      <span
        v-if="position % groupSize === 0 && position < length"
        class="base-code-input__separator"
        aria-hidden="true"
      >
        –
      </span>
    </template>
  </PinInputRoot>
</template>

<style scoped>
.base-code-input {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}
.base-code-input__digit {
  /* Boxes shrink together on a narrow phone instead of pushing the card wider. */
  flex: 1 1 0;
  min-width: 0;
  max-width: 48px;
  aspect-ratio: 4 / 5;
  box-sizing: border-box;
  padding: 0;
  font: inherit;
  font-size: var(--text-lg);
  font-variant-numeric: tabular-nums;
  text-align: center;
  color: var(--ink);
  background: var(--paper-deep);
  border: 1px solid var(--paper-line);
  border-radius: 10px;
  caret-color: var(--rust);
}
.base-code-input__digit:focus-visible {
  outline: 2px solid var(--rust);
  outline-offset: 1px;
}
.base-code-input__digit--invalid {
  border-color: var(--rust);
}
.base-code-input__digit:disabled {
  opacity: 0.6;
}
.base-code-input__separator {
  flex: none;
  font-size: var(--text-lg);
  color: var(--ink-dim);
}
</style>
