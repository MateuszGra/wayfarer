<script setup lang="ts">
import { BaseCard } from '@/design-system';
import { t } from '@/shared/i18n';

defineOptions({ name: 'RotateHint' });
</script>

<template>
  <!--
    Shown only on a touch screen held upright: the landscape is the point of the game and a phone can't
    be locked to landscape from a browser tab (an installed app opens in landscape through its manifest).
  -->
  <div class="rotate-hint" role="alert" data-testid="rotate-hint">
    <BaseCard class="rotate-hint__card">
      <svg class="rotate-hint__icon" viewBox="0 0 86 86" width="176" height="176" aria-hidden="true">
        <!--
        A phone showing a tiny view of the game. It turns a quarter clockwise inside the arrow's arc while
        the view on its screen stays level, so turned on its side the screen holds more of the landscape.
      -->
        <defs>
          <clipPath id="rotate-hint-screen">
            <rect x="30.5" y="20.5" width="19" height="39" rx="2" />
          </clipPath>
        </defs>
        <g class="rotate-hint__phone">
          <rect x="28" y="18" width="24" height="44" rx="4.5" fill="var(--ink)" />
          <g clip-path="url(#rotate-hint-screen)">
            <g class="rotate-hint__view">
              <!--
                A wide view with the tent in the middle, so even the narrow upright screen shows it; the far
                mountains, the sun and the pines on either side only fit on its side.
              -->
              <rect x="10" y="10" width="60" height="60" fill="var(--mist)" />
              <circle cx="55" cy="35.5" r="3" fill="var(--sun)" />
              <polygon points="16,44 27,33.5 33,38.5 37,36 45,44" fill="var(--mist-deep)" />
              <polygon points="24.6,36 27,33.5 29.4,36 27,35.2" fill="var(--paper)" />
              <rect x="10" y="44" width="60" height="26" fill="var(--pine)" />
              <path d="M10 47.5Q30 45.5 40 46.5T70 46.5" fill="none" stroke="var(--paper-deep)" stroke-width="1" />
              <polygon points="33,44 37.5,37.5 42,44" fill="var(--rust)" />
              <polygon points="36.3,44 37.5,41.2 38.7,44" fill="var(--ink)" />
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
      <p class="rotate-hint__title">{{ t('rotate.title') }}</p>
    </BaseCard>
  </div>
</template>

<style scoped>
.rotate-hint {
  display: none;
}
@media (orientation: portrait) and (pointer: coarse) {
  .rotate-hint {
    position: fixed;
    inset: 0;
    /* Above the game and its windows; the splash screen, at the very top, still plays first. */
    z-index: 900;
    display: flex;
    background: var(--paper);
  }
}
/* The whole screen is paper with the menu's double frame running round its edges. */
.rotate-hint__card {
  flex: 1;
  display: flex;
  border-radius: 0;
  box-shadow: none;
  text-align: center;
  color: var(--ink);
  padding: max(var(--space-2), env(safe-area-inset-top)) max(var(--space-2), env(safe-area-inset-right))
    max(var(--space-2), env(safe-area-inset-bottom)) max(var(--space-2), env(safe-area-inset-left));
}
.rotate-hint__card :deep(.base-card__inner) {
  flex: 1;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: var(--space-3);
}
.rotate-hint__phone,
.rotate-hint__view {
  transform-box: view-box;
  transform-origin: 40px 40px;
  animation: rotate-hint-turn 2.4s ease-in-out infinite;
}
/* The view on the screen turns back as the phone turns, so the horizon stays level. */
.rotate-hint__view {
  animation-name: rotate-hint-level;
}
.rotate-hint__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
@keyframes rotate-hint-turn {
  0%,
  30% {
    transform: rotate(0deg);
  }
  60%,
  100% {
    transform: rotate(90deg);
  }
}
@keyframes rotate-hint-level {
  0%,
  30% {
    transform: rotate(0deg);
  }
  60%,
  100% {
    transform: rotate(-90deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .rotate-hint__phone {
    animation: none;
    transform: rotate(90deg);
  }
  .rotate-hint__view {
    animation: none;
    transform: rotate(-90deg);
  }
}
</style>
