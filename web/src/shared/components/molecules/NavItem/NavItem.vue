<script setup lang="ts">
export interface Props {
  to: string;
  label: string;
}

defineOptions({ name: 'NavItem' });
defineProps<Props>();
</script>

<template>
  <RouterLink :to="to" class="nav-item" active-class="nav-item--active">{{ label }}</RouterLink>
</template>

<style scoped>
.nav-item {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-pill);
  color: var(--fg-dim);
  font-size: var(--text-sm);
  text-decoration: none;
}
.nav-item--active {
  background: var(--fg);
  color: var(--bg);
}
</style>
