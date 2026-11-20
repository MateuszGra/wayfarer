<script setup lang="ts">
export interface Props {
  /** `primary`/`ghost` sit on the scene (glass); `ink`/`paper`/`link` sit on paper panels. */
  variant?: 'primary' | 'ghost' | 'ink' | 'paper' | 'link';
  size?: 'sm' | 'md';
  type?: 'button' | 'submit';
  block?: boolean;
}

defineOptions({ name: 'BaseButton' });
withDefaults(defineProps<Props>(), { variant: 'ghost', size: 'md', type: 'button', block: false });
</script>

<template>
  <button
    :type="type"
    class="base-button"
    :class="[`base-button--${variant}`, `base-button--${size}`, { 'base-button--block': block }]"
  >
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
.base-button:disabled {
  opacity: 0.6;
  cursor: progress;
}
.base-button--sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
}
.base-button--md {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-md);
}
.base-button--block {
  width: 100%;
}
.base-button--ghost {
  background: var(--glass);
}
.base-button--primary {
  background: var(--fg);
  color: var(--bg);
  border-color: var(--fg);
}
.base-button--ink {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
  font-weight: 600;
  letter-spacing: 0.02em;
}
.base-button--ink:hover {
  background: var(--rust-deep);
  border-color: var(--rust-deep);
}
.base-button--paper {
  background: transparent;
  color: var(--ink);
  border-color: var(--paper-line);
}
.base-button--paper:hover {
  color: var(--rust-deep);
  border-color: var(--rust);
}
.base-button--link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--ink-dim);
  font-size: var(--text-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.base-button--link:hover {
  color: var(--rust-deep);
}
</style>
