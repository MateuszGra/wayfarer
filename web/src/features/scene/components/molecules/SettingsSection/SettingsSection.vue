<script setup lang="ts">
export interface Props {
  title: string;
}

defineOptions({ name: 'SettingsSection' });
defineProps<Props>();
</script>

<template>
  <section class="settings-section">
    <h3 class="settings-section__title">{{ title }}</h3>
    <slot />
  </section>
</template>

<style scoped>
.settings-section {
  display: grid;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid var(--paper-line);
}
.settings-section__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-md);
  color: var(--ink);
}
</style>
