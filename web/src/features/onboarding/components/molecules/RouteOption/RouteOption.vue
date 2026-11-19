<script setup lang="ts">
import { t, type TranslationKey } from '@/shared/i18n';

export interface Props {
  routeId: string;
  lengthKm: number;
  selected: boolean;
}

defineOptions({ name: 'RouteOption' });
defineProps<Props>();
const emit = defineEmits<{ select: [] }>();
</script>

<template>
  <button
    type="button"
    role="radio"
    class="route-option"
    :class="{ 'route-option--selected': selected }"
    :aria-checked="selected"
    :data-testid="`route-${routeId}`"
    @click="emit('select')"
  >
    <span class="route-option__name">{{ t(`route.${routeId}` as TranslationKey) }}</span>
    <span class="route-option__length">{{ t('plan.routeLength', { km: lengthKm.toLocaleString('pl-PL') }) }}</span>
  </button>
</template>

<style scoped>
.route-option {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3);
  font: inherit;
  color: var(--ink);
  text-align: left;
  background: transparent;
  border: 1.5px solid var(--paper-line);
  border-radius: 12px;
  cursor: pointer;
}
.route-option--selected {
  border-color: var(--rust);
  background: var(--paper-deep);
}
.route-option__name {
  font-weight: 600;
}
.route-option__length {
  font-size: var(--text-sm);
  color: var(--ink-dim);
  white-space: nowrap;
}
</style>
