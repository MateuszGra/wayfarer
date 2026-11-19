<script setup lang="ts">
export interface Props {
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md';
  type?: 'button' | 'submit';
}

defineOptions({ name: 'BaseButton' });
withDefaults(defineProps<Props>(), { variant: 'ghost', size: 'md', type: 'button' });
</script>

<template>
  <button :type="type" class="base-button" :class="[`base-button--${variant}`, `base-button--${size}`]">
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  font: inherit;
  color: var(--fg);
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  cursor: pointer;
}
.base-button--sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
}
.base-button--md {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-md);
}
.base-button--ghost {
  background: var(--glass);
}
.base-button--primary {
  background: var(--fg);
  color: var(--bg);
  border-color: var(--fg);
}
</style>
