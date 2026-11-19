<script setup lang="ts">
export interface Props {
  as?: 'div' | 'section';
  /** A square game panel, as menus in games usually are. */
  square?: boolean;
}

defineOptions({ name: 'BaseCard' });
withDefaults(defineProps<Props>(), { as: 'section', square: false });
</script>

<template>
  <component :is="as" class="base-card" :class="{ 'base-card--square': square }">
    <div class="base-card__inner"><slot /></div>
  </component>
</template>

<style scoped>
/* Paper panel with a double postcard border; flat, no gradients, like the rest of the world. */
.base-card {
  box-sizing: border-box;
  padding: var(--space-2);
  background: var(--paper);
  color: var(--ink);
  border-radius: 18px;
  box-shadow: var(--shadow-panel);
}
.base-card--square {
  display: flex;
  width: min(400px, calc(100vw - 2 * var(--space-4)));
  min-height: min(400px, calc(100vw - 2 * var(--space-4)));
}
.base-card--square > .base-card__inner {
  flex: 1;
}
.base-card__inner {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: var(--space-6) var(--space-6) var(--space-4);
  border: 1.5px solid var(--paper-line);
  border-radius: 12px;
}
</style>
