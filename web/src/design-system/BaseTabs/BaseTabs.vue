<script setup lang="ts" generic="T extends string">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui';

export interface BaseTab<V extends string> {
  readonly value: V;
  readonly label: string;
  /** Path data of a 20×20 line icon shown before the label. */
  readonly icon?: string;
}

export interface Props<V extends string> {
  modelValue: V;
  tabs: readonly BaseTab<V>[];
  /** Accessible name of the tab list, e.g. what the tabs choose between. */
  label: string;
}

defineOptions({ name: 'BaseTabs' });
defineProps<Props<T>>();
const emit = defineEmits<{ 'update:modelValue': [value: T] }>();
// One slot per tab, named after its value, holds that tab's panel.
defineSlots<Record<T, () => unknown>>();
</script>

<template>
  <TabsRoot class="base-tabs" :model-value="modelValue" @update:model-value="emit('update:modelValue', $event as T)">
    <TabsList class="base-tabs__list" :aria-label="label">
      <TabsTrigger
        v-for="tab in tabs"
        :key="tab.value"
        class="base-tabs__tab"
        :value="tab.value"
        :data-testid="`tab-${tab.value}`"
      >
        <svg v-if="tab.icon" class="base-tabs__icon" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
          <path
            :d="tab.icon"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>{{ tab.label }}</span>
      </TabsTrigger>
    </TabsList>
    <TabsContent v-for="tab in tabs" :key="tab.value" class="base-tabs__panel" :value="tab.value">
      <slot :name="tab.value" />
    </TabsContent>
  </TabsRoot>
</template>

<style scoped>
.base-tabs {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-height: 0;
  flex: 1;
}
.base-tabs__list {
  display: flex;
  align-self: center;
  gap: var(--space-1);
  max-width: 100%;
  padding: var(--space-1);
  background: var(--paper-deep);
  border: 1px solid var(--paper-line);
  border-radius: var(--radius-pill);
}
.base-tabs__tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-2) var(--space-4);
  font: inherit;
  font-size: var(--text-md);
  color: var(--ink-dim);
  background: none;
  border: 0;
  border-radius: var(--radius-pill);
  cursor: pointer;
}
.base-tabs__tab:hover {
  color: var(--ink);
}
.base-tabs__tab[data-state='active'] {
  color: var(--paper);
  font-weight: 600;
  background: var(--ink);
}
.base-tabs__icon {
  flex: none;
}
/* On a small phone a long label wraps onto two lines; beside it the icon would sit far from the words,
   so it goes above them instead, the label centred under it. */
@media (max-width: 420px) {
  .base-tabs__tab {
    flex-direction: column;
    gap: 2px;
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-sm);
    line-height: 1.2;
    text-align: center;
  }
}
.base-tabs__tab:focus-visible {
  outline: 2px solid var(--rust);
  outline-offset: 2px;
}
.base-tabs__panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-height: 0;
  flex: 1;
}
.base-tabs__panel[hidden] {
  display: none;
}
.base-tabs__panel:focus-visible {
  outline: none;
}
</style>
