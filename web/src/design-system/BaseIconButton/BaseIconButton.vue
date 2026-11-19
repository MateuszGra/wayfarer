<script setup lang="ts">
export interface Props {
  /** Required: an icon-only button needs a text label for screen readers. */
  label: string;
}

defineOptions({ name: 'BaseIconButton' });
defineProps<Props>();
</script>

<template>
  <button type="button" class="base-icon-button" :aria-label="label" :title="label">
    <slot />
  </button>
</template>

<style scoped>
.base-icon-button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  color: var(--ink);
  background: var(--paper);
  border: 1.5px solid var(--paper-line);
  border-radius: 50%;
  box-shadow: var(--shadow-panel);
  cursor: pointer;
}
.base-icon-button:hover {
  color: var(--rust-deep);
}
</style>
