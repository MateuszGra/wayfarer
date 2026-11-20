// The splash art in its own units: a splash of paint and the footprints of people walking out of it.
// On the splash screen these shapes are holes in the black, so the game shows through them.
//
// The art spans about 480 units around the splash at (200, 280). The view box is much larger and centred
// on the splash, so it sits small in the middle of the screen like a loading mark rather than filling it.
export const SPLASH_VIEWBOX = '-215 -135 830 830';

// The splash is paint poured from above that ran out in arms of every length: a round body with a few
// bulges, arms that narrow and end in a round bead, deep soft bays between them, one long arm curling
// away, and a few loose drops around. It is drawn as plain shapes (circles and round-capped arms) that
// the splash screen melts together with a blur-and-threshold filter, which gives the smooth, liquid
// joins of real paint; nothing is simulated.
const CENTRE: readonly [number, number] = [205, 278];
/** The middle of the splash, where the reveal spreads from. */
export const SPLASH_CENTRE = CENTRE;
const round = (n: number): number => Math.round(n * 10) / 10;
/** Angle in degrees, 0 up the screen, growing clockwise. */
const polar = (degrees: number, radius: number): [number, number] => [
  round(CENTRE[0] + Math.sin((degrees * Math.PI) / 180) * radius),
  round(CENTRE[1] - Math.cos((degrees * Math.PI) / 180) * radius),
];

/** The body: a round middle and a few bulges that make it uneven: [x, y, r]. */
export const STAIN_BODY: readonly (readonly [number, number, number])[] = [
  [...CENTRE, 44],
  [...polar(40, 30), 25],
  [...polar(150, 30), 22],
  [...polar(225, 28), 24],
  [...polar(310, 26), 20],
];

// Each arm: direction, how far out its bead sits, its width, the bead's radius and how much it curls
// (a share of its length, sideways).
const ARM_SPECS = [
  { heading: -48, reach: 96, width: 10, bead: 9, curl: 0.12 },
  { heading: 6, reach: 80, width: 9, bead: 8, curl: -0.06 },
  { heading: 56, reach: 88, width: 11, bead: 10, curl: -0.1 },
  { heading: 96, reach: 68, width: 14, bead: 12, curl: 0.05 },
  { heading: 128, reach: 58, width: 13, bead: 10, curl: 0 },
  { heading: 166, reach: 74, width: 15, bead: 13, curl: -0.08 },
  { heading: 206, reach: 112, width: 9, bead: 8, curl: 0.22 },
  { heading: 252, reach: 70, width: 13, bead: 11, curl: -0.05 },
  { heading: 292, reach: 56, width: 12, bead: 11, curl: 0.08 },
] as const;

export interface Arm {
  readonly d: string;
  readonly width: number;
  readonly bead: readonly [number, number, number];
}

export const STAIN_ARMS: readonly Arm[] = ARM_SPECS.map(({ heading, reach, width, bead, curl }) => {
  const [ex, ey] = polar(heading, reach);
  // The bend sits halfway out, pushed sideways, so the arm curves rather than kinks.
  const [mx, my] = polar(heading + (curl * 180) / Math.PI, reach / 2);
  return { d: `M${CENTRE[0]} ${CENTRE[1]}Q${mx} ${my} ${ex} ${ey}`, width, bead: [ex, ey, bead] };
});

/** A few loose drops around the splash, clear of the arms: [x, y, r]. */
export const DROPS: readonly (readonly [number, number, number])[] = [
  [...polar(28, 118), 5],
  [...polar(76, 120), 3.5],
  [...polar(146, 112), 4.5],
  [...polar(232, 104), 6],
  [...polar(322, 120), 4],
];

/** One bare footprint, toes up, centred on the origin. */
export const FOOTPRINT =
  'M1 -32C3 -32 6 -32 8 -30C10 -28 11 -26 12 -23C13 -20 13 -16 13 -13C13 -10 13 -8 12 -5C11 -2 10 0 9 3C8 6 8 8 8 10C8 12 9 16 9 18C9 20 10 23 9 25C8 27 8 29 6 30C4 31 2 31 0 31C-2 31 -4 31 -6 30C-8 29 -8 27 -9 25C-10 23 -9 20 -9 18C-9 16 -8 13 -8 10C-8 7 -8 5 -9 2C-10 -1 -11 -3 -12 -6C-13 -9 -13 -12 -13 -15C-13 -18 -12 -22 -11 -25C-10 -28 -8 -30 -6 -31C-4 -32 -1 -32 1 -32Z';

/** A footprint's place: x, y, rotation in degrees, and scale (negative mirrors it into a left foot). */
export type Step = readonly [x: number, y: number, rotate: number, scale: number];

// Three people walk out of the splash one after another, a third of a turn apart so the picture stays
// balanced: up to the right, down to the right, and to the left. Each takes four even steps, feet
// alternating either side of their line, starting inside the splash.
const HEADINGS = [30, 150, 270] as const;
const STEPS_EACH = 4;
const FIRST_STEP = 50;
const STRIDE = 64;
const FOOT_SPREAD = 9;
const FOOT_SIZE = 0.95;

function walkOut(heading: number): Step[] {
  const rad = (heading * Math.PI) / 180;
  // Perpendicular to the walk, towards the walker's left.
  const [lx, ly] = [-Math.cos(rad), -Math.sin(rad)];
  return Array.from({ length: STEPS_EACH }, (_, i) => {
    const left = i % 2 === 0;
    const [x, y] = polar(heading, FIRST_STEP + i * STRIDE);
    const side = left ? FOOT_SPREAD : -FOOT_SPREAD;
    return [round(x + lx * side), round(y + ly * side), heading, left ? -FOOT_SIZE : FOOT_SIZE] as const;
  });
}

/** Each trail is one of the three walkers, steps in walking order. */
export const TRAILS: readonly (readonly Step[])[] = HEADINGS.map(walkOut);
