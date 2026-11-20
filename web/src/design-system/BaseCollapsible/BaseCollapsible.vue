<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui';

export interface Props {
  /** Text on the trigger that opens and closes the section. */
  title: string;
  open?: boolean;
}

defineOptions({ name: 'BaseCollapsible' });
withDefaults(defineProps<Props>(), { open: false });
const emit = defineEmits<{ 'update:open': [open: boolean] }>();
</script>

<template>
  <CollapsibleRoot class="base-collapsible" :open="open" @update:open="emit('update:open', $event)">
    <CollapsibleTrigger class="base-collapsible__trigger">
      <span>{{ title }}</span>
      <svg class="base-collapsible__chevron" viewBox="0 0 20 20" width="12" height="12" aria-hidden="true">
        <path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
      </svg>
    </CollapsibleTrigger>
    <CollapsibleContent class="base-collapsible__content">
      <slot />
    </CollapsibleContent>
  </CollapsibleRoot>
</template>

<style scoped>
.base-collapsible {
  display: grid;
  gap: var(--space-2);
}
.base-collapsible__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  font: inherit;
  font-size: var(--text-sm);
  color: var(--fg-dim);
  background: none;
  border: 0;
  cursor: pointer;
}
.base-collapsible__trigger:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.base-collapsible__chevron {
  transition: transform 0.2s ease;
}
.base-collapsible__trigger[data-state='open'] .base-collapsible__chevron {
  transform: rotate(180deg);
}
.base-collapsible__content {
  display: grid;
  gap: var(--space-3);
}
</style>
