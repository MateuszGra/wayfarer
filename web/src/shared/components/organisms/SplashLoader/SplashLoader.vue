<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { t } from '@/shared/i18n';
import {
  DROPS,
  FOOTPRINT,
  SPLASH_CENTRE,
  SPLASH_VIEWBOX,
  STAIN_ARMS,
  STAIN_BODY,
  TRAILS,
  type Step,
} from './splashArt';
import { splashTimeline } from './splashTimeline';

export interface Props {
  /** Show everything at once and only fade, for players who asked for less motion. */
  reducedMotion?: boolean;
  /**
   * Time already spent loading the page before the splash appeared, in ms. It is taken off the splash,
   * so the whole intro, loading included, ends two seconds after the page was opened.
   */
  elapsedMs?: number;
}

defineOptions({ name: 'SplashLoader' });
const props = withDefaults(defineProps<Props>(), { reducedMotion: false, elapsedMs: 0 });
const emit = defineEmits<{ done: [] }>();

const timeline = splashTimeline(
  TRAILS.map((trail) => trail.length),
  props.reducedMotion,
);
const footprints = TRAILS.flatMap((trail, trailIndex) =>
  trail.map((step: Step, i) => ({
    key: `${trailIndex}-${i}`,
    transform: `translate(${step[0]} ${step[1]}) rotate(${step[2]}) scale(${step[3]} ${Math.abs(step[3])})`,
    // A negative delay starts the footprint's fade part-way, as if it had begun during loading.
    delay: `${(timeline.steps[trailIndex]?.[i] ?? 0) - props.elapsedMs}ms`,
  })),
);

const revealing = ref(false);
const spreadFrom = `${SPLASH_CENTRE[0]}px ${SPLASH_CENTRE[1]}px`;
const timers: ReturnType<typeof setTimeout>[] = [];
const reveal = (): void => {
  if (revealing.value) return;
  revealing.value = true;
  timers.forEach(clearTimeout);
  timers.push(setTimeout(() => emit('done'), timeline.doneAt - timeline.revealAt));
};
onMounted(() => timers.push(setTimeout(reveal, Math.max(0, timeline.revealAt - props.elapsedMs))));
onBeforeUnmount(() => timers.forEach(clearTimeout));
</script>

<template>
  <div
    class="splash-loader"
    :class="{ 'splash-loader--revealing': revealing, 'splash-loader--still': reducedMotion }"
    role="status"
    :aria-label="t('splash.loading')"
    data-testid="splash-loader"
    @click="reveal"
  >
    <!-- Black over the whole app with holes cut in it: the splash and the footprints show the game beneath. -->
    <svg class="splash-loader__veil" width="100%" height="100%" aria-hidden="true">
      <defs>
        <!-- Melts the splash's circles and arms into one liquid shape: blur, then cut the blur off sharply. -->
        <filter id="splash-melt" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
        </filter>
        <mask id="splash-holes" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
          <rect width="100%" height="100%" fill="#fff" />
          <svg width="100%" height="100%" :viewBox="SPLASH_VIEWBOX" preserveAspectRatio="xMidYMid meet">
            <!-- On reveal the splash spreads from its middle until it uncovers the whole screen. -->
            <g class="splash-loader__spread" :style="{ transformOrigin: spreadFrom }">
              <g class="splash-loader__stain" :style="{ animationDelay: `${timeline.stainAt - elapsedMs}ms` }">
                <g filter="url(#splash-melt)">
                  <circle v-for="([x, y, r], i) in STAIN_BODY" :key="`body-${i}`" :cx="x" :cy="y" :r="r" fill="#000" />
                  <template v-for="(arm, i) in STAIN_ARMS" :key="`arm-${i}`">
                    <path :d="arm.d" fill="none" stroke="#000" :stroke-width="arm.width" stroke-linecap="round" />
                    <circle :cx="arm.bead[0]" :cy="arm.bead[1]" :r="arm.bead[2]" fill="#000" />
                  </template>
                </g>
                <circle v-for="([x, y, r], i) in DROPS" :key="i" :cx="x" :cy="y" :r="r" fill="#000" />
              </g>
            </g>
            <path
              v-for="step in footprints"
              :key="step.key"
              class="splash-loader__step"
              :d="FOOTPRINT"
              :transform="step.transform"
              :style="{ animationDelay: step.delay }"
              fill="#000"
            />
          </svg>
        </mask>
      </defs>
      <rect width="100%" height="100%" class="splash-loader__black" mask="url(#splash-holes)" />
    </svg>
  </div>
</template>

<style scoped>
.splash-loader {
  position: fixed;
  inset: 0;
  /* Above everything, dialogs included, which the game opens in portals at the end of the page. */
  z-index: 1000;
  /* The last of the black, deep in the corners and the splash's bays, fades as the spread ends. */
  transition: opacity 0.2s ease 0.3s;
}
.splash-loader--revealing {
  opacity: 0;
  pointer-events: none;
}
.splash-loader__spread {
  transform-box: view-box;
  /* Slow to start, then rushing out, like paint that has found its way across the floor. */
  transition: transform 0.5s cubic-bezier(0.55, 0, 0.8, 0.2);
}
.splash-loader--revealing .splash-loader__spread {
  /* Enough for the splash's body to reach past every corner of a wide screen. */
  transform: scale(26);
}
.splash-loader--still {
  transition: opacity 0.5s ease;
}
.splash-loader--still .splash-loader__spread {
  transition: none;
}
.splash-loader--still.splash-loader--revealing .splash-loader__spread {
  transform: none;
}
.splash-loader__veil {
  display: block;
}
.splash-loader__black {
  fill: var(--bg);
}
/* Mask colours are luminance, not theme colours: white keeps the black, black cuts a hole. */
.splash-loader__stain,
.splash-loader__step {
  opacity: 0;
  animation: splash-appear 0.35s ease-out forwards;
}
.splash-loader__step {
  animation-duration: 0.18s;
}
@keyframes splash-appear {
  to {
    opacity: 1;
  }
}
</style>
