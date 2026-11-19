<script setup lang="ts">
import { BaseButton, BaseDialog, BaseIconButton, WorldEmblem } from '@/design-system';
import type { MenuEntry } from '@/shared/composables/useGameMenu';
import { t } from '@/shared/i18n';

export interface Props {
  open: boolean;
  entries: readonly MenuEntry[];
  /** Another game window is open; its own corner × takes the menu button's place. */
  covered?: boolean;
}

defineOptions({ name: 'GameMenu' });
withDefaults(defineProps<Props>(), { covered: false });
const emit = defineEmits<{ 'update:open': [open: boolean]; select: [id: MenuEntry['id']]; logout: [] }>();
</script>

<template>
  <BaseIconButton
    v-show="!open && !covered"
    class="game-menu__trigger"
    :label="t('menu.open')"
    data-testid="menu-open"
    @click="emit('update:open', true)"
  >
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  </BaseIconButton>
  <BaseDialog
    :open="open"
    :title="t('menu.title')"
    :escape-closes="false"
    :corner-close-label="t('menu.close')"
    @update:open="emit('update:open', $event)"
  >
    <template #art><WorldEmblem /></template>
    <nav class="game-menu" :aria-label="t('menu.title')">
      <BaseButton
        v-for="entry in entries"
        :key="entry.id"
        variant="ink"
        block
        :data-testid="`menu-${entry.id}`"
        @click="emit('select', entry.id)"
      >
        {{ t(entry.label) }}
      </BaseButton>
      <!-- Sign-out is always the last entry, set apart from the rest. -->
      <hr class="game-menu__divider" />
      <BaseButton variant="paper" block data-testid="menu-logout" @click="emit('logout')">
        {{ t('menu.logout') }}
      </BaseButton>
    </nav>
  </BaseDialog>
</template>

<style scoped>
.game-menu__trigger {
  position: absolute;
  top: max(var(--space-4), env(safe-area-inset-top));
  right: var(--gutter);
}
.game-menu {
  display: grid;
  gap: var(--space-3);
}
.game-menu__divider {
  margin: var(--space-2) 0;
  border: 0;
  border-top: 1px solid var(--paper-line);
}
</style>
