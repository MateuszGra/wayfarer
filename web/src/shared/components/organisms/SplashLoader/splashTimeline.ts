export interface SplashTimeline {
  /** When the splash fades in, in ms from the start. */
  readonly stainAt: number;
  /** For each trail, when each of its footprints appears, in ms from the start. */
  readonly steps: readonly (readonly number[])[];
  /** When the splash starts spreading over the screen and the game shows. */
  readonly revealAt: number;
  /** When the splash screen is gone. */
  readonly doneAt: number;
}

// Black first, then the splash; one person walks out of it at a calm pace, then a second a little
// quicker, then the last at a run (with more trails, the rest would all run out together). A short
// pause with every step on screen, then the splash spreads over the screen.
// The whole intro lasts two seconds from opening the page, so it charms rather than makes anyone wait.
const STAIN_AT = 50;
const FIRST_WALKER = { start: 300, pace: 120 };
const SECOND_WALKER = { gap: 70, pace: 110 };
const CROWD = { gap: 80, stagger: 50, pace: 70 };
const HOLD = 150;
// The splash spreads from its middle to the edges of the screen.
const REVEAL = 500;
// With reduced motion everything is there at once and the black only fades.
const STILL_REVEAL_AT = 300;

const walk = (start: number, pace: number, count: number): number[] =>
  Array.from({ length: count }, (_, i) => start + i * pace);

/** The order of the splash screen, given how many footprints each trail has. */
export function splashTimeline(trailLengths: readonly number[], reducedMotion = false): SplashTimeline {
  if (reducedMotion) {
    return {
      stainAt: 0,
      steps: trailLengths.map((count) => walk(0, 0, count)),
      revealAt: STILL_REVEAL_AT,
      doneAt: STILL_REVEAL_AT + REVEAL,
    };
  }
  const [firstCount = 0, secondCount = 0, ...crowdCounts] = trailLengths;
  const first = walk(FIRST_WALKER.start, FIRST_WALKER.pace, firstCount);
  const secondStart = (first.at(-1) ?? FIRST_WALKER.start) + SECOND_WALKER.gap;
  const second = walk(secondStart, SECOND_WALKER.pace, secondCount);
  const crowdStart = (second.at(-1) ?? secondStart) + CROWD.gap;
  const crowd = crowdCounts.map((count, i) => walk(crowdStart + i * CROWD.stagger, CROWD.pace, count));
  const steps = [first, second, ...crowd];
  const lastStep = Math.max(STAIN_AT, ...steps.flat());
  return { stainAt: STAIN_AT, steps, revealAt: lastStep + HOLD, doneAt: lastStep + HOLD + REVEAL };
}
