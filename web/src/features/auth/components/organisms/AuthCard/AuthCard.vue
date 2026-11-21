<script setup lang="ts">
import { BaseCard, WorldEmblem } from '@/design-system';

export interface Props {
  title: string;
}

defineOptions({ name: 'AuthCard' });
defineProps<Props>();
</script>

<template>
  <BaseCard square>
    <WorldEmblem />
    <h1 class="auth-card__title">{{ title }}</h1>
    <div class="auth-card__body">
      <slot />
    </div>
  </BaseCard>
</template>

<style scoped>
.auth-card__title {
  margin: var(--space-3) 0 var(--space-4);
  font-family: var(--font-display);
  font-size: var(--text-lg);
  text-align: center;
}
.auth-card__body {
  display: grid;
  gap: var(--space-3);
}
</style>
