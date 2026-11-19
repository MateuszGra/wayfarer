<script setup lang="ts">
export interface Props {
  as?: 'div' | 'section' | 'aside';
  padding?: 'sm' | 'md';
}

defineOptions({ name: 'BasePanel' });
withDefaults(defineProps<Props>(), { as: 'div', padding: 'md' });
</script>

<template>
  <component :is="as" class="base-panel" :class="`base-panel--${padding}`">
    <slot />
  </component>
</template>

<style scoped>
.base-panel {
  border-radius: var(--radius-panel);
  background: var(--glass);
  border: 1px solid var(--line);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.base-panel--sm {
  padding: var(--space-2) var(--space-3);
}
.base-panel--md {
  padding: var(--space-3) var(--space-4);
}
</style>
