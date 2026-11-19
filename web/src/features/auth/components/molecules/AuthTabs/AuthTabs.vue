<script setup lang="ts">
import { t } from '@/shared/i18n';

export type AuthMode = 'login' | 'register';

export interface Props {
  modelValue: AuthMode;
}

defineOptions({ name: 'AuthTabs' });
defineProps<Props>();
const emit = defineEmits<{ 'update:modelValue': [mode: AuthMode] }>();

const tabs = [
  { mode: 'login', label: 'auth.tab.login' },
  { mode: 'register', label: 'auth.tab.register' },
] as const;
</script>

<template>
  <div class="auth-tabs" role="tablist" :aria-label="t('auth.tabs')">
    <button
      v-for="tab in tabs"
      :key="tab.mode"
      type="button"
      role="tab"
      class="auth-tabs__tab"
      :class="{ 'auth-tabs__tab--active': tab.mode === modelValue }"
      :aria-selected="tab.mode === modelValue"
      :data-testid="`auth-tab-${tab.mode}`"
      @click="emit('update:modelValue', tab.mode)"
    >
      {{ t(tab.label) }}
    </button>
  </div>
</template>

<style scoped>
.auth-tabs {
  display: flex;
  justify-content: center;
  gap: var(--space-6);
  border-bottom: 1px solid var(--paper-line);
}
.auth-tabs__tab {
  padding: var(--space-2) 0;
  margin-bottom: -1px;
  font: inherit;
  font-size: var(--text-md);
  color: var(--ink-dim);
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}
.auth-tabs__tab--active {
  color: var(--ink);
  font-weight: 600;
  border-bottom-color: var(--rust);
}
</style>
