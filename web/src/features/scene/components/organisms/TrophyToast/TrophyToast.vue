<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import type { TrophyProgress } from '@shared/achievements/trophies';
import { t, type TranslationKey } from '@/shared/i18n';
import TrophyIcon from '../../atoms/TrophyIcon/TrophyIcon.vue';

export interface Props {
  /** The trophy just won, or null when there is nothing to celebrate. */
  trophy: TrophyProgress | null;
}

defineOptions({ name: 'TrophyToast' });
const props = defineProps<Props>();
const emit = defineEmits<{ done: []; open: [] }>();

const name = computed(() => (props.trophy ? t(`trophy.${props.trophy.id}.name` as TranslationKey) : ''));
let timer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => props.trophy?.id,
  (id) => {
    clearTimeout(timer);
    if (id) timer = setTimeout(() => emit('done'), SHOW_MS);
  },
  { immediate: true },
);
onBeforeUnmount(() => clearTimeout(timer));
</script>

<script lang="ts">
// Long enough to read the name and see the medal settle; a tap opens the trophies instead.
export const SHOW_MS = 5000;
</script>

<template>
  <Transition name="trophy-toast">
    <button
      v-if="trophy"
      :key="trophy.id"
      type="button"
      class="trophy-toast"
      role="status"
      :aria-label="t('trophy.toast', { name })"
      data-testid="trophy-toast"
      @click="emit('open')"
    >
      <span class="trophy-toast__medal" aria-hidden="true">
        <!-- A slow sunburst behind the medal, the only bright light in the paper world. -->
        <svg class="trophy-toast__rays" viewBox="-50 -50 100 100">
          <path
            v-for="i in 12"
            :key="i"
            d="M0 0L-4 -48A48 48 0 0 1 4 -48Z"
            :transform="`rotate(${i * 30})`"
            fill="var(--sun)"
          />
        </svg>
        <span class="trophy-toast__icon"><TrophyIcon :id="trophy.id" /></span>
      </span>
      <span class="trophy-toast__text">
        <span class="trophy-toast__kicker">{{ t('trophy.toastTitle') }}</span>
        <span class="trophy-toast__name">{{ name }}</span>
      </span>
    </button>
  </Transition>
</template>

<style scoped>
/* A paper card that drops in under the top edge, centred, above the scene and the HUD. */
.trophy-toast {
  position: absolute;
  z-index: 5;
  top: max(var(--space-4), env(safe-area-inset-top));
  left: 50%;
  translate: -50% 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  max-width: calc(100vw - 2 * var(--gutter));
  padding: var(--space-2) var(--space-4) var(--space-2) var(--space-2);
  font: inherit;
  color: var(--ink);
  text-align: left;
  background: var(--paper);
  border: 1.5px solid var(--paper-line);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-panel);
  cursor: pointer;
}
.trophy-toast__medal {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
}
.trophy-toast__rays {
  position: absolute;
  inset: -22px;
  width: calc(100% + 44px);
  height: calc(100% + 44px);
  opacity: 0;
  animation:
    trophy-toast-rays-in 0.9s 0.25s ease-out forwards,
    trophy-toast-spin 9s linear infinite;
}
.trophy-toast__icon {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  box-shadow:
    0 0 0 2px var(--paper),
    0 0 0 4px var(--sun);
  animation: trophy-toast-pop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.trophy-toast__text {
  display: grid;
  gap: 2px;
}
.trophy-toast__kicker {
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--rust);
}
.trophy-toast__name {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
}
@keyframes trophy-toast-pop {
  0% {
    transform: scale(0) rotate(-25deg);
  }
  70% {
    transform: scale(1.15) rotate(6deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}
@keyframes trophy-toast-rays-in {
  to {
    opacity: 0.35;
  }
}
@keyframes trophy-toast-spin {
  to {
    rotate: 360deg;
  }
}
.trophy-toast-enter-active {
  transition:
    opacity 0.35s ease,
    translate 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.trophy-toast-leave-active {
  transition:
    opacity 0.4s ease,
    translate 0.4s ease;
}
.trophy-toast-enter-from,
.trophy-toast-leave-to {
  opacity: 0;
  translate: -50% -24px;
}
@media (prefers-reduced-motion: reduce) {
  .trophy-toast__rays {
    animation: trophy-toast-rays-in 0.3s forwards;
  }
  .trophy-toast__icon {
    animation: none;
  }
  .trophy-toast-enter-active,
  .trophy-toast-leave-active {
    transition: opacity 0.3s ease;
  }
}
</style>
