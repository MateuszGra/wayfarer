<script setup lang="ts">
export interface Props {
  text: string;
  emphasis?: boolean;
}

defineOptions({ name: 'StatLine' });
withDefaults(defineProps<Props>(), { emphasis: false });
</script>

<template>
  <p class="stat-line" :class="{ 'stat-line--emphasis': emphasis }">{{ text }}</p>
</template>

<style scoped>
.stat-line {
  margin: var(--space-1) 0 0;
  color: var(--fg-dim);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  text-shadow: var(--shadow-text);
}
.stat-line--emphasis {
  color: var(--fg);
  font-size: var(--text-lg);
  font-weight: 600;
}
</style>
