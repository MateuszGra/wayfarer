<script setup lang="ts">
import type { DayOutcome } from '@shared/steps/history';

export interface Props {
  outcome: DayOutcome;
  /** Varies the hand-pressed tilt of the stamp from day to day. */
  day: number;
}

defineOptions({ name: 'DayStamp' });
defineProps<Props>();

// A stamp pressed by hand is never straight; the tilt is fixed per day so it doesn't change between visits.
const tilt = (day: number): number => ((day * 37) % 25) - 12;
</script>

<template>
  <!-- A day's mark in the traveller's journal, drawn in the world's flat style. -->
  <svg class="day-stamp" :class="`day-stamp--${outcome}`" viewBox="0 0 48 48" aria-hidden="true">
    <g v-if="outcome === 'reached'" :transform="`rotate(${tilt(day)} 24 24)`">
      <circle cx="24" cy="24" r="21" class="day-stamp__ink-line" stroke-width="2.4" />
      <circle cx="24" cy="24" r="17" class="day-stamp__ink-line" stroke-width="1.2" stroke-dasharray="2 2.2" />
      <circle cx="29" cy="18" r="4" class="day-stamp__ink" />
      <path d="M11 32 L19 21 L24 27 L28 23 L37 32 Z" class="day-stamp__ink" />
      <path d="M12 35 H36" class="day-stamp__ink-line" stroke-width="1.6" stroke-linecap="round" />
    </g>
    <g v-else-if="outcome === 'missed'" class="day-stamp__faint">
      <ellipse cx="17" cy="30" rx="4" ry="6.5" transform="rotate(-12 17 30)" />
      <circle cx="15" cy="21" r="2.4" />
      <ellipse cx="31" cy="20" rx="4" ry="6.5" transform="rotate(12 31 20)" />
      <circle cx="33" cy="11" r="2.4" />
    </g>
    <g v-else class="day-stamp__faint">
      <path d="M8 38 L24 12 L40 38 Z" />
      <path d="M24 12 L40 38 L30 38 Z" class="day-stamp__shade" />
      <path d="M20 38 L24 29 L28 38 Z" class="day-stamp__door" />
    </g>
  </svg>
</template>

<style scoped>
.day-stamp {
  width: 48px;
  height: 48px;
  flex: none;
}
.day-stamp__ink {
  fill: var(--rust);
}
.day-stamp__ink-line {
  fill: none;
  stroke: var(--rust);
}
.day-stamp__faint {
  fill: var(--paper-line);
}
.day-stamp__shade {
  fill: var(--ink-dim);
  opacity: 0.35;
}
.day-stamp__door {
  fill: var(--paper);
}
</style>
