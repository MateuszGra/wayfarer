// Time-of-day palette ported from the scene prototype; see docs/style-guide.md, "Time of day".
export interface Palette {
  readonly top: number;
  readonly horizon: number;
  readonly haze: number;
  readonly light: number;
  readonly cloud: number;
  readonly bright: number;
  readonly stars: number;
}

interface Keyframe extends Palette {
  readonly hour: number;
}

const KEYFRAMES: readonly Keyframe[] = [
  {
    hour: 0,
    top: 0x060a1c,
    horizon: 0x18203f,
    haze: 0x19213d,
    light: 0x5a6a9a,
    cloud: 0x262d4a,
    bright: 0.24,
    stars: 1,
  },
  {
    hour: 4.6,
    top: 0x070b1e,
    horizon: 0x1c2343,
    haze: 0x1b2341,
    light: 0x5a6a9a,
    cloud: 0x2a3150,
    bright: 0.24,
    stars: 1,
  },
  {
    hour: 5.5,
    top: 0x1a2350,
    horizon: 0x9a6478,
    haze: 0x5a5476,
    light: 0x9a86aa,
    cloud: 0x8f7393,
    bright: 0.42,
    stars: 0.35,
  },
  {
    hour: 6.4,
    top: 0x3a5f9e,
    horizon: 0xf4a46c,
    haze: 0xc99a90,
    light: 0xffc596,
    cloud: 0xffc0a0,
    bright: 0.72,
    stars: 0,
  },
  {
    hour: 8.5,
    top: 0x3f7ec6,
    horizon: 0xc4dbee,
    haze: 0xabc5da,
    light: 0xfff2e2,
    cloud: 0xffffff,
    bright: 0.98,
    stars: 0,
  },
  {
    hour: 13,
    top: 0x3374c2,
    horizon: 0xc9e0f1,
    haze: 0xb4cce0,
    light: 0xffffff,
    cloud: 0xffffff,
    bright: 1.05,
    stars: 0,
  },
  {
    hour: 17.2,
    top: 0x4572b2,
    horizon: 0xf0d09c,
    haze: 0xd2b8a2,
    light: 0xffe2b4,
    cloud: 0xfff0dc,
    bright: 0.96,
    stars: 0,
  },
  {
    hour: 19.1,
    top: 0x2f3f7a,
    horizon: 0xf48b58,
    haze: 0xbf7f7c,
    light: 0xffa06a,
    cloud: 0xff9c7c,
    bright: 0.72,
    stars: 0.02,
  },
  {
    hour: 20.2,
    top: 0x161c42,
    horizon: 0x74496c,
    haze: 0x48405f,
    light: 0x8a72a0,
    cloud: 0x5d4a6c,
    bright: 0.4,
    stars: 0.45,
  },
  {
    hour: 21.4,
    top: 0x090d24,
    horizon: 0x232a4c,
    haze: 0x1f2746,
    light: 0x5a6a9a,
    cloud: 0x2a3150,
    bright: 0.25,
    stars: 0.95,
  },
  {
    hour: 24,
    top: 0x060a1c,
    horizon: 0x18203f,
    haze: 0x19213d,
    light: 0x5a6a9a,
    cloud: 0x262d4a,
    bright: 0.24,
    stars: 1,
  },
];

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const smoothstep = (t: number): number => t * t * (3 - 2 * t);

export function mixColor(a: number, b: number, t: number): number {
  const k = clamp01(t);
  const channel = (shift: number): number => {
    const ca = (a >> shift) & 255;
    const cb = (b >> shift) & 255;
    return Math.round(ca + (cb - ca) * k) << shift;
  };
  return channel(16) | channel(8) | channel(0);
}

export function paletteAt(hour: number): Palette {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < KEYFRAMES.length - 2 && (KEYFRAMES[i + 1] as Keyframe).hour <= h) i++;
  const a = KEYFRAMES[i] as Keyframe;
  const b = KEYFRAMES[i + 1] as Keyframe;
  const t = smoothstep((h - a.hour) / (b.hour - a.hour));
  return {
    top: mixColor(a.top, b.top, t),
    horizon: mixColor(a.horizon, b.horizon, t),
    haze: mixColor(a.haze, b.haze, t),
    light: mixColor(a.light, b.light, t),
    cloud: mixColor(a.cloud, b.cloud, t),
    bright: a.bright + (b.bright - a.bright) * t,
    stars: a.stars + (b.stars - a.stars) * t,
  };
}
