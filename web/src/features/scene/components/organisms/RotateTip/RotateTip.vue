<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { useSplash } from '@/shared/composables/useSplash';
import { useUprightPhone } from '@/shared/composables/useUprightPhone';
import { t } from '@/shared/i18n';

defineOptions({ name: 'RotateTip' });

// A moment after the game opens on a phone held upright, a small badge suggests turning it, since the
// landscape shows more of the road; it goes away on its own. Once per page load, never after the splash
// is still playing, and gone at once if the phone is turned meanwhile.
const upright = useUprightPhone();
const splash = useSplash();
const visible = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

watch(
  [upright, splash.playing],
  ([isUpright, playing]) => {
    if (!isUpright) {
      clearTimeout(timer);
      timer = undefined;
      visible.value = false;
      return;
    }
    if (playing || tipShown || timer) return;
    timer = setTimeout(() => {
      tipShown = true;
      visible.value = true;
      timer = setTimeout(() => (visible.value = false), VISIBLE_MS);
    }, SHOW_AFTER_MS);
  },
  { immediate: true },
);
onBeforeUnmount(() => clearTimeout(timer));
</script>

<script lang="ts">
export const SHOW_AFTER_MS = 3000;
export const VISIBLE_MS = 4000;
// Shared by every instance: the tip plays at most once until the page is reloaded.
let tipShown = false;

/** Test helper: as if the page had just loaded. */
export function resetRotateTipForTests(): void {
  tipShown = false;
}
</script>

<template>
  <Transition name="rotate-tip">
    <div v-if="visible" class="rotate-tip" role="status" :aria-label="t('rotate.tip')" data-testid="rotate-tip">
      <svg viewBox="0 0 86 86" width="72" height="72" aria-hidden="true">
        <!--
          A phone showing a tiny view of the game. It turns a quarter clockwise inside the arrow's arc while
          the view on its screen stays level, so turned on its side the screen holds more of the landscape.
        -->
        <defs>
          <clipPath id="rotate-tip-screen">
            <rect x="30.5" y="20.5" width="19" height="39" rx="2" />
          </clipPath>
        </defs>
        <g class="rotate-tip__phone">
          <rect x="28" y="18" width="24" height="44" rx="4.5" fill="var(--ink)" />
          <g clip-path="url(#rotate-tip-screen)">
            <g class="rotate-tip__view">
              <rect x="10" y="10" width="60" height="60" fill="var(--mist)" />
              <circle cx="55" cy="35.5" r="3" fill="var(--sun)" />
              <polygon points="16,44 27,33.5 33,38.5 37,36 45,44" fill="var(--mist-deep)" />
              <polygon points="24.6,36 27,33.5 29.4,36 27,35.2" fill="var(--paper)" />
              <rect x="10" y="44" width="60" height="26" fill="var(--pine)" />
              <polygon points="33,44 37.5,37.5 42,44" fill="var(--rust)" />
              <polygon points="51,44 53,38.5 55,44" fill="var(--ink)" opacity="0.75" />
              <polygon points="55.5,44 57.5,37.5 59.5,44" fill="var(--ink)" opacity="0.75" />
            </g>
          </g>
          <rect x="36" y="20" width="8" height="1.6" rx="0.8" fill="var(--ink)" />
        </g>
        <path d="M40 6a34 34 0 0 1 34 34" fill="none" stroke="var(--rust)" stroke-width="3" stroke-linecap="round" />
        <path
          d="M67.5 37h13L74 47Z"
          fill="var(--rust)"
          stroke="var(--rust)"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </Transition>
</template>

<style scoped>
/* A small, half see-through badge under the status line at the top; it never takes a tap meant for the
   game and leaves the camp in plain view. */
.rotate-tip {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-top: var(--space-3);
  border-radius: 50%;
  background: var(--paper);
  opacity: 0.75;
  pointer-events: none;
}
.rotate-tip svg {
  width: 44px;
  height: 44px;
}
.rotate-tip__phone,
.rotate-tip__view {
  transform-box: view-box;
  transform-origin: 40px 40px;
  animation: rotate-tip-turn 2s ease-in-out infinite;
}
/* The view on the screen turns back as the phone turns, so the horizon stays level. */
.rotate-tip__view {
  animation-name: rotate-tip-level;
}
@keyframes rotate-tip-turn {
  0%,
  30% {
    transform: rotate(0deg);
  }
  60%,
  100% {
    transform: rotate(90deg);
  }
}
@keyframes rotate-tip-level {
  0%,
  30% {
    transform: rotate(0deg);
  }
  60%,
  100% {
    transform: rotate(-90deg);
  }
}
.rotate-tip-enter-active,
.rotate-tip-leave-active {
  transition: opacity 0.4s ease;
}
.rotate-tip-enter-from,
.rotate-tip-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .rotate-tip__phone {
    animation: none;
    transform: rotate(90deg);
  }
  .rotate-tip__view {
    animation: none;
    transform: rotate(-90deg);
  }
}
</style>
