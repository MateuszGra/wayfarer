<script setup lang="ts">
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui';
import BaseCard from '../BaseCard/BaseCard.vue';

export interface Props {
  open: boolean;
  title: string;
  /** Show the title only to screen readers when the panel carries its own heading art. */
  hideTitle?: boolean;
  /** Let the caller own the Escape key (e.g. when Escape also opens the dialog). */
  escapeCloses?: boolean;
  /** `square` for menus; `wide` for large content such as the map. */
  size?: 'square' | 'wide';
  /** Accessible label of a close (×) button in the corner; no button when omitted. */
  closeLabel?: string | undefined;
  /**
   * Accessible label of a close (×) button in the screen's top-right corner, where the game's menu button
   * sits: while a window is open the menu button reads as its close button.
   */
  cornerCloseLabel?: string | undefined;
}

defineOptions({ name: 'BaseDialog' });
const props = withDefaults(defineProps<Props>(), {
  hideTitle: false,
  escapeCloses: true,
  size: 'square',
  closeLabel: undefined,
  cornerCloseLabel: undefined,
});
const emit = defineEmits<{ 'update:open': [open: boolean] }>();

const onEscape = (event: KeyboardEvent): void => {
  if (!props.escapeCloses) event.preventDefault();
};
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="base-dialog__overlay" />
      <DialogContent class="base-dialog__content" :aria-describedby="undefined" @escape-key-down="onEscape">
        <DialogClose
          v-if="cornerCloseLabel"
          class="base-dialog__corner-close"
          :aria-label="cornerCloseLabel"
          data-testid="dialog-corner-close"
        >
          <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </DialogClose>
        <BaseCard :square="size === 'square'" :class="{ 'base-dialog__wide': size === 'wide' }">
          <DialogClose v-if="closeLabel" class="base-dialog__close" :aria-label="closeLabel" data-testid="dialog-close">
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </DialogClose>
          <slot name="art" />
          <DialogTitle class="base-dialog__title" :class="{ 'base-dialog__title--hidden': hideTitle }">
            {{ title }}
          </DialogTitle>
          <slot />
        </BaseCard>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.base-dialog__overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 8, 18, 0.45);
}
.base-dialog__content {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  pointer-events: none;
}
.base-dialog__content > * {
  pointer-events: auto;
}
.base-dialog__wide {
  display: flex;
  width: min(1000px, calc(100vw - 2 * var(--space-4)));
  height: min(720px, calc(100dvh - 2 * var(--space-4)));
}
.base-dialog__wide > :deep(.base-card__inner) {
  flex: 1;
  justify-content: flex-start;
  min-height: 0;
  padding: var(--space-3);
}
.base-dialog__content :deep(.base-card) {
  position: relative;
}
.base-dialog__corner-close {
  position: fixed;
  top: max(var(--space-4), env(safe-area-inset-top));
  right: var(--gutter);
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  color: var(--ink);
  background: var(--paper);
  border: 1.5px solid var(--paper-line);
  border-radius: 50%;
  box-shadow: var(--shadow-panel);
  cursor: pointer;
  pointer-events: auto;
}
.base-dialog__corner-close:hover {
  color: var(--rust-deep);
}
.base-dialog__close {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  z-index: 1;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  color: var(--ink);
  background: var(--paper);
  border: 1.5px solid var(--paper-line);
  border-radius: 50%;
  cursor: pointer;
}
.base-dialog__close:hover {
  color: var(--rust-deep);
  border-color: var(--rust);
}
.base-dialog__title {
  margin: var(--space-3) 0 var(--space-4);
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: center;
}
.base-dialog__title--hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
