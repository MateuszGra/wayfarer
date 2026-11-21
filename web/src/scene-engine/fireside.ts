/** Seconds of the animation clock: by the fire he keeps to one thing, his pipe or a mug of tea, for this long. */
export const FIRESIDE_STRETCH_S = 30;
/** Seconds to put one down and take up the other. */
const SWITCH_S = 0.6;

// A cheap, stable hash of a whole number to 0..1, so each stretch picks the same thing every time.
const pick = (n: number): number => {
  const x = Math.sin(n * 91.7 + 19.3) * 43758.5453;
  return x - Math.floor(x);
};
const pipeIn = (stretch: number): number => (pick(stretch) < 0.5 ? 1 : 0);
const smooth = (a: number, b: number, x: number): number => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/**
 * How far the pipe is in his hand at second `t`, from 0 (the mug of tea) to 1 (the pipe). Each stretch
 * picks one of them at random; when it differs from the stretch before he swaps over smoothly at its start,
 * and when it is the same he simply carries on.
 */
export function pipeAt(t: number): number {
  const stretch = Math.floor(t / FIRESIDE_STRETCH_S);
  const into = t - stretch * FIRESIDE_STRETCH_S;
  const before = pipeIn(stretch - 1),
    now = pipeIn(stretch);
  return before + (now - before) * smooth(0, SWITCH_S, into);
}
