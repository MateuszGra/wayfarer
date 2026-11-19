<script setup lang="ts">
import { BasePanel } from '@/design-system';
import NavItem from '@/shared/components/molecules/NavItem/NavItem.vue';
import { t } from '@/shared/i18n';

defineOptions({ name: 'BottomNav' });

const TRANSLATION_KEYS = {
  label: 'nav.label',
  scene: 'nav.scene',
  map: 'nav.map',
  journal: 'nav.journal',
  settings: 'nav.settings',
} as const;

const items = [
  { to: '/scene', label: TRANSLATION_KEYS.scene },
  { to: '/map', label: TRANSLATION_KEYS.map },
  { to: '/journal', label: TRANSLATION_KEYS.journal },
  { to: '/settings', label: TRANSLATION_KEYS.settings },
] as const;
</script>

<template>
  <nav class="bottom-nav" :aria-label="t(TRANSLATION_KEYS.label)">
    <BasePanel padding="sm" class="bottom-nav__panel">
      <NavItem
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        :label="t(item.label)"
        :data-testid="`nav-${item.to.slice(1)}`"
      />
    </BasePanel>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 50%;
  bottom: max(var(--space-4), env(safe-area-inset-bottom));
  transform: translateX(-50%);
}
.bottom-nav__panel {
  display: flex;
  gap: var(--space-1);
  border-radius: var(--radius-pill);
}
</style>
