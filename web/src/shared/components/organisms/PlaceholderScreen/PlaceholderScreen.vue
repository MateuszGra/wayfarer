<script setup lang="ts">
import { BasePanel } from '@/design-system';
import { t } from '@/shared/i18n';

export interface Props {
  title: string;
}

defineOptions({ name: 'PlaceholderScreen' });
defineProps<Props>();
</script>

<template>
  <main class="placeholder-screen">
    <BasePanel as="section" class="placeholder-screen__panel">
      <h1 class="placeholder-screen__title">{{ title }}</h1>
      <p class="placeholder-screen__text">{{ t('common.comingSoon') }}</p>
    </BasePanel>
  </main>
</template>

<style scoped>
.placeholder-screen {
  display: grid;
  place-items: center;
  height: 100%;
  padding: 0 var(--gutter);
}
.placeholder-screen__panel {
  width: min(420px, 100%);
}
.placeholder-screen__title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-lg);
}
.placeholder-screen__text {
  margin: 0;
  color: var(--fg-dim);
  font-size: var(--text-md);
}
</style>
