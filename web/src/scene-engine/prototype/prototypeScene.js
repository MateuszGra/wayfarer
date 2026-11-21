/* eslint-disable */
// TEMPORARY BRIDGE: the whole scene in one file, grown from the first single-page prototype; the host
// element, the start options and the control API are at the bottom. It is ported into typed modules
// (sky, landscape, biomes, wanderer, camp, weather) step by step; until then it is excluded from lint and format.
import { Application, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { leadOf, pitchHour, seatOut, tentUp } from '../campSchedule';
import { CAT_RIDE, CAT_WASH, catRideOverlaps, catWashSkipped } from '../catSchedule';
import { catWear } from '../catWear';
// Renamed: this file has its own `pipeAt`, the pipe's place in his hand for drawing the smoke.
import { pipeAt as firesidePipe } from '../fireside';
import { cloudBand, cloudGrey, landFog, rainLook } from '../weatherLook';
import { GUST_SECONDS, gustAt, gustDebris } from '../windGusts';

/** @type {import('./prototypeScene').startPrototypeScene} */
export async function startPrototypeScene(host, options = {}) {

  // ---------- math, colour, noise ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  const mod = (a, n) => ((a % n) + n) % n;
  const rgb = c => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  const hex = ([r, g, b]) => (clamp(Math.round(r), 0, 255) << 16) | (clamp(Math.round(g), 0, 255) << 8) | clamp(Math.round(b), 0, 255);
  const mix = (a, b, t) => { t = clamp(t); const A = rgb(a), B = rgb(b); return hex([lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)]); };
  const mul = (a, b, k = 1) => { const A = rgb(a), B = rgb(b); return hex([A[0] * B[0] / 255 * k, A[1] * B[1] / 255 * k, A[2] * B[2] / 255 * k]); };
  const css = c => '#' + c.toString(16).padStart(6, '0');

  function hash(i, seed) {
    let h = Math.imul((i | 0) ^ Math.imul(seed | 0, 0x9E3779B1), 0x85EBCA6B);
    h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  // Linear interpolation ("angular") gives faceted rock edges; smoothstep gives soft hills.
  function noise1(x, seed, angular = false) {
    const i = Math.floor(x), f = x - i;
    const t = angular ? f : f * f * (3 - 2 * f);
    return lerp(hash(i, seed), hash(i + 1, seed), t);
  }
  function fbm(x, seed, oct, ridged, angular) {
    let sum = 0, amp = 1, norm = 0, fr = 1;
    for (let o = 0; o < oct; o++) {
      let n = noise1(x * fr, seed + o * 7919, angular);
      if (ridged) n = 1 - Math.abs(n * 2 - 1);
      sum += n * amp; norm += amp; amp *= 0.5; fr *= 2.07;
    }
    return sum / norm;
  }
  // Two-bone IK. bend = -1 puts the joint on the +x side (knees), +1 on the -x side (elbows).
  function ik(hx, hy, tx, ty, l1, l2, bend) {
    const dx = tx - hx, dy = ty - hy;
    const d = Math.max(0.01, Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01));
    const a = Math.atan2(dy, dx);
    const b = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    return [hx + Math.cos(a + bend * b) * l1, hy + Math.sin(a + bend * b) * l1];
  }

  // ---------- time-of-day palette ----------
  const KEYS = [
    { h: 0,    top: 0x060a1c, hor: 0x18203f, haze: 0x19213d, light: 0x5a6a9a, cloud: 0x262d4a, bright: 0.24, stars: 1 },
    { h: 4.6,  top: 0x070b1e, hor: 0x1c2343, haze: 0x1b2341, light: 0x5a6a9a, cloud: 0x2a3150, bright: 0.24, stars: 1 },
    { h: 5.5,  top: 0x1a2350, hor: 0x9a6478, haze: 0x5a5476, light: 0x9a86aa, cloud: 0x8f7393, bright: 0.42, stars: 0.35 },
    { h: 6.4,  top: 0x3a5f9e, hor: 0xf4a46c, haze: 0xc99a90, light: 0xffc596, cloud: 0xffc0a0, bright: 0.72, stars: 0 },
    { h: 8.5,  top: 0x3f7ec6, hor: 0xc4dbee, haze: 0xabc5da, light: 0xfff2e2, cloud: 0xffffff, bright: 0.98, stars: 0 },
    { h: 13,   top: 0x3374c2, hor: 0xc9e0f1, haze: 0xb4cce0, light: 0xffffff, cloud: 0xffffff, bright: 1.05, stars: 0 },
    { h: 17.2, top: 0x4572b2, hor: 0xf0d09c, haze: 0xd2b8a2, light: 0xffe2b4, cloud: 0xfff0dc, bright: 0.96, stars: 0 },
    { h: 19.1, top: 0x2f3f7a, hor: 0xf48b58, haze: 0xbf7f7c, light: 0xffa06a, cloud: 0xff9c7c, bright: 0.72, stars: 0.02 },
    { h: 20.2, top: 0x161c42, hor: 0x74496c, haze: 0x48405f, light: 0x8a72a0, cloud: 0x5d4a6c, bright: 0.4,  stars: 0.45 },
    { h: 21.4, top: 0x090d24, hor: 0x232a4c, haze: 0x1f2746, light: 0x5a6a9a, cloud: 0x2a3150, bright: 0.25, stars: 0.95 },
    { h: 24,   top: 0x060a1c, hor: 0x18203f, haze: 0x19213d, light: 0x5a6a9a, cloud: 0x262d4a, bright: 0.24, stars: 1 },
  ];
  function paletteAt(h) {
    let i = 0;
    while (i < KEYS.length - 2 && KEYS[i + 1].h <= h) i++;
    const a = KEYS[i], b = KEYS[i + 1];
    const t = smooth(0, 1, (h - a.h) / (b.h - a.h));
    return {
      top: mix(a.top, b.top, t), hor: mix(a.hor, b.hor, t), haze: mix(a.haze, b.haze, t),
      light: mix(a.light, b.light, t), cloud: mix(a.cloud, b.cloud, t),
      bright: lerp(a.bright, b.bright, t), stars: lerp(a.stars, b.stars, t),
    };
  }

  // ---------- biomes ----------
  // Heights are fractions of screen height; `wave` is the feature width in screen-heights;
  // `speed` is the parallax factor relative to the path the traveller walks on.
  const BIOMES = {
    fields: {
      // Kujawy and Greater Poland: flat plains in a patchwork of stubble, grain and meadow (greyish beiges
      // and muted greens, never a bright yellow: the game's palette is a sombre one), poplar avenues
      // along field roads, white villages with red roofs around a brick church, farmsteads, hay bales,
      // storks feeding in the meadow, a tractor now and then, a hunting stand at a field edge, and a band
      // of forest on the horizon.
      name: 'Polskie pola', clouds: 7, rays: 0.5, mist: 0.8, fireflies: 0.4, mistAfter: [1],
      layers: [
        // Horizon: distant villages with church towers in the haze, then an uneven band of forest with gaps.
        { kind: 'hill', depth: 1, base: 0.625, amp: 0.012, wave: 0.7, oct: 2, speed: 0.005, color: 0x8796a0, fog: 0.3,
          village: { wall: 0xe8e2d4, roof: 0xb05a40, church: 0xa86450, spacing: 0.9, scale: 0.55 } },
        { kind: 'hill', depth: 0.9, base: 0.645, amp: 0.02, wave: 0.6, oct: 3, speed: 0.012, color: 0x6c8574, fog: 0.3,
          trees: { type: 'round', spacing: 0.005, h: [0.02, 0.038], density: 0.95, mix: 0.4, groves: 0.32 } },
        { kind: 'hill', depth: 0.7, base: 0.675, amp: 0.018, wave: 0.5, oct: 3, speed: 0.03, color: 0x9fae6a, fog: 0.22,
          patchwork: { colors: [0xb4ad93, 0xaea78d, 0x97a472], bands: 4 },
          stands: { spacing: 1.6, chance: 0.55, scale: 0.6 } },
        { kind: 'hill', depth: 0.5, base: 0.725, amp: 0.028, wave: 0.45, oct: 3, speed: 0.08, color: 0x9aae5e, fog: 0.14,
          patchwork: { colors: [0xb9b092, 0xb3a98c, 0x92a467, 0xa4ab78], bands: 5, bales: true },
          // Now and then a village has a little corner shop under a green neon sign, "Ropucha". Rare on
          // purpose: more of them spoil the countryside (the trophy's "on every corner" is only a joke).
          village: { wall: 0xeee6d2, roof: 0xb24a30, church: 0xa54c33, spacing: 1.1, shops: 0.05 },
          farms: { spacing: 0.9, chance: 0.6 }, tractors: { spacing: 1.3, chance: 0.45 } },
        { kind: 'hill', depth: 0.32, base: 0.83, amp: 0.024, wave: 0.4, oct: 3, speed: 0.22, color: 0x86a552, fog: 0.07,
          patchwork: { colors: [0xbcb293, 0xb6ab8d, 0x889f60], bands: 6, bales: true },
          trees: { type: 'poplar', spacing: 0.05, h: [0.1, 0.125], density: 1, avenue: 0.26, avenueShare: 0.24, color: 0x4f6e44 },
          storks: { spacing: 0.7, chance: 0.55 }, shrines: { spacing: 2.4, chance: 0.6 } },
        { kind: 'ground', depth: 0.07, base: 0.96, amp: 0.016, wave: 0.3, oct: 3, speed: 1, color: 0x6c8444, path: 0xb79c6c,
          grass: { spacing: 0.005, h: [0.015, 0.038], density: 0.8, light: 0.35 },
          flowers: { colors: [0x4f6fd0, 0xd8352a, 0xf4f0e6, 0x4f6fd0], density: 0.18 } },
      ],
      overlay: null,
    },
    baltic: {
      name: 'Bałtyk', lake: 0.585, clouds: 6, rays: 0.5, mist: 0.7, fireflies: 0.1, mistAfter: [0], birdColor: 0xf4f3ee,
      water: { tint: 0x9db5c4, body: 0x2c5a68, bodyAlpha: 0.55, shimmer: 90 },
      vessels: ['cargo', 'cutter'],
      // Looking out to the open sea from a green coastal belt. No islands: the Baltic shore is a clean,
      // flat horizon. Pines and the lighthouse stand on the green ground behind the beach.
      layers: [
        'lake',
        { kind: 'hill', depth: 0.55, base: 0.735, amp: 0.012, wave: 0.8, oct: 2, speed: 0.12, color: 0xe8d8b0, beach: true, fog: 0.05,
          boats: { spacing: 0.8, chance: 0.6, wall: 0x4c6478, roof: 0x7a5a3c }, groynes: { spacing: 1.1 } },
        { kind: 'hill', depth: 0.4, base: 0.84, amp: 0.06, wave: 0.3, oct: 3, speed: 0.28, color: 0x6f8a58, fog: 0.08,
          trees: { type: 'coastpine', spacing: 0.022, h: [0.06, 0.11], density: 0.6, groves: 0.35, color: 0x3d5a45 },
          lighthouse: { spacing: 7, chance: 1, height: 0.17, first: 0.66, wall: 0xb04a3a, roof: 0x2f2c2e } },
        { kind: 'hill', depth: 0.2, base: 0.93, amp: 0.045, wave: 0.2, oct: 3, speed: 0.55, color: 0x5f7448, fog: 0.06, tufts: true,
          trees: { type: 'coastpine', spacing: 0.085, h: [0.18, 0.28], density: 0.4, groves: 0.45, color: 0x34503f } },
        { kind: 'ground', depth: 0.07, base: 0.965, amp: 0.016, wave: 0.25, oct: 3, speed: 1, color: 0x667249, path: 0xc4b286,
          grass: { spacing: 0.005, h: [0.012, 0.032], density: 0.7, light: 0.35 },
          flowers: { colors: [0x8f8ad0, 0xe39ac0], density: 0.06 } },
      ],
      overlay: null,
    },
    mountains: {
      // Now and then, by day, an angler drifts across the lake in a rowing boat.
      vessels: ['angler'],
      name: 'Góry i jezioro', sprig: 0xf2efe6, snowLine: 0.27, lake: 0.655, clouds: 5, rays: 0.7, mist: 1.0, fireflies: 0.6, mistAfter: [1, 3],
      layers: [
        { kind: 'ridge', depth: 1.0, base: 0.56, amp: 0.36, wave: 0.42, oct: 5, ridged: true, sharp: 1.3, speed: 0.01, color: 0xa9bdd0, snow: 0.62, faces: true, fog: 0.4, reflect: true, rim: true },
        { kind: 'ridge', depth: 0.84, base: 0.6, amp: 0.25, wave: 0.3, oct: 5, ridged: true, sharp: 1.2, speed: 0.03, color: 0x7f95aa, snow: 0.42, faces: true, fog: 0.45, reflect: true },
        { kind: 'ridge', depth: 0.66, base: 0.66, amp: 0.13, wave: 0.24, oct: 4, speed: 0.07, color: 0x5c7778, faces: true, fog: 0.4, reflect: true,
          trees: { type: 'pine', spacing: 0.0065, h: [0.012, 0.022], density: 0.9, groves: 0.3 } },
        'lake',
        { kind: 'hill', depth: 0.42, base: 0.82, amp: 0.07, wave: 0.3, oct: 3, speed: 0.25, color: 0x30503f, fog: 0.28,
          trees: { type: 'pine', spacing: 0.012, h: [0.035, 0.065], density: 0.85, groves: 0.25 },
          cabins: { spacing: 1.5, chance: 0.7, size: 0.012, wall: 0x8a5c3a, roof: 0x4e3526 } },
        { kind: 'hill', depth: 0.2, base: 0.905, amp: 0.05, wave: 0.25, oct: 3, speed: 0.55, color: 0x223a2f, fog: 0.15,
          trees: { type: 'pine', spacing: 0.026, h: [0.08, 0.15], density: 0.65, groves: 0.35 } },
        { kind: 'ground', depth: 0.06, base: 0.955, amp: 0.03, wave: 0.16, oct: 3, angular: true, speed: 1, color: 0x2e2c29, path: 0x75674f,
          grass: { spacing: 0.006, h: [0.008, 0.022], density: 0.55, light: 0.25 },
          flowers: { colors: [0xf4f0e6, 0xf3cf4a, 0xa98be0], density: 0.14 } },
      ],
      overlay: { kind: 'overlay', depth: 0, speed: 1.6, wave: 0.35, oct: 3, angular: true, color: 0x14171a },
    },
    lakes: {
      // Pomerania's lake district: a long lake between low wooded shores, no mountains anywhere. The woods
      // are mixed, broadleaves with pines among them, and the far shores lie mirrored in the water.
      vessels: ['angler', 'sailboat', 'swans'],
      name: 'Pojezierze', sprig: 0xe9dca8, snowLine: 1, lake: 0.64, clouds: 5, rays: 0.8, mist: 1.3, fireflies: 0.8, mistAfter: [1, 3],
      layers: [
        { kind: 'hill', depth: 0.9, base: 0.6, amp: 0.07, wave: 0.45, oct: 3, speed: 0.012, color: 0x6f8e86, fog: 0.45, reflect: true,
          trees: { type: 'round', spacing: 0.005, h: [0.008, 0.013], density: 0.95, mix: 0.4 } },
        { kind: 'hill', depth: 0.75, base: 0.625, amp: 0.05, wave: 0.35, oct: 3, speed: 0.03, color: 0x4f7360, fog: 0.38, reflect: true,
          trees: { type: 'round', spacing: 0.0065, h: [0.012, 0.02], density: 0.9, mix: 0.35, birch: 0.35, groves: 0.25 },
          cabins: { spacing: 1.6, chance: 0.5, size: 0.007, wall: 0x8a5c3a, roof: 0xa04a32 } },
        'lake',
        // The near shore is low and its trees stand in clumps, so the lake shows between them.
        { kind: 'hill', depth: 0.42, base: 0.86, amp: 0.04, wave: 0.3, oct: 3, speed: 0.25, color: 0x3a5d42, fog: 0.28,
          trees: { type: 'round', spacing: 0.013, h: [0.03, 0.055], density: 0.45, mix: 0.35, birch: 0.45, groves: 0.6 },
          cabins: { spacing: 1.5, chance: 0.6, size: 0.012, wall: 0x8a5c3a, roof: 0x4e3526 },
          jetties: { spacing: 3.2, chance: 0.6 } },
        { kind: 'hill', depth: 0.2, base: 0.925, amp: 0.035, wave: 0.25, oct: 3, speed: 0.55, color: 0x274630, fog: 0.15,
          trees: { type: 'round', spacing: 0.03, h: [0.09, 0.16], density: 0.4, mix: 0.3, birch: 0.5, groves: 0.4 } },
        { kind: 'ground', depth: 0.06, base: 0.955, amp: 0.025, wave: 0.2, oct: 3, speed: 1, color: 0x2d3424, path: 0x6f604a,
          grass: { spacing: 0.005, h: [0.01, 0.026], density: 0.75, light: 0.3 },
          flowers: { colors: [0xf4f0e6, 0xf3cf4a, 0xa98be0], density: 0.12 } },
      ],
      // No rocks by the lake: the near shore grows bushes and reeds instead.
      overlay: { kind: 'overlay', depth: 0, speed: 1.6, wave: 0.3, oct: 3, color: 0x121812, reeds: true, rise: 0.4 },
    },
    forest: {
      // Low beech forest is the mid one without the grey mountains on the horizon.
      levels: { low: { relief: 1, treeDensity: 1, cabins: 1, dropRidges: true } },
      name: 'Las bukowy', sprig: 0x9c6fb0, snowLine: 0.42, lake: null, clouds: 4, rays: 1.0, mist: 1.5, fireflies: 1, mistAfter: [0, 1, 2],
      layers: [
        { kind: 'ridge', depth: 1, base: 0.6, amp: 0.17, wave: 0.5, oct: 4, speed: 0.01, color: 0x93a7ad, faces: true, fog: 0.5, rim: true },
        { kind: 'hill', depth: 0.8, base: 0.66, amp: 0.12, wave: 0.36, oct: 4, speed: 0.035, color: 0x6f8c70, fog: 0.45,
          trees: { type: 'round', spacing: 0.006, h: [0.012, 0.02], density: 0.95 } },
        // Rarely, on this wooded ridge, something big steps out between the beeches and is gone again.
        { kind: 'hill', depth: 0.6, base: 0.74, amp: 0.1, wave: 0.3, oct: 3, speed: 0.1, color: 0x4f7653, fog: 0.4, bigfoot: true,
          trees: { type: 'round', spacing: 0.009, h: [0.025, 0.045], density: 0.95, mix: 0.15 },
          cabins: { spacing: 1.3, chance: 0.6, size: 0.009, wall: 0x8a5c3a, roof: 0x4e3526 } },
        { kind: 'hill', depth: 0.38, base: 0.84, amp: 0.07, wave: 0.28, oct: 3, speed: 0.25, color: 0x35583c, fog: 0.3,
          trees: { type: 'round', spacing: 0.016, h: [0.06, 0.1], density: 0.9, mix: 0.2 } },
        { kind: 'hill', depth: 0.18, base: 0.93, amp: 0.05, wave: 0.25, oct: 3, speed: 0.55, color: 0x243f2b, fog: 0.15,
          trees: { type: 'round', spacing: 0.07, h: [0.16, 0.26], density: 0.5 } },
        { kind: 'ground', depth: 0.06, base: 0.96, amp: 0.025, wave: 0.2, oct: 3, speed: 1, color: 0x2b3122, path: 0x66573f,
          grass: { spacing: 0.005, h: [0.01, 0.028], density: 0.8, light: 0.3 },
          flowers: { colors: [0xf4f0e6, 0xf6d45a, 0xf4f0e6], density: 0.1 } },
      ],
      overlay: { kind: 'overlay', depth: 0, speed: 1.6, wave: 0.3, oct: 3, color: 0x111710 },
    },
    meseta: {
      name: 'Meseta', sprig: 0xd9b45a, lake: null, clouds: 7, rays: 0.4, mist: 0.5, fireflies: 0.2, mistAfter: [1],
      layers: [
        { kind: 'ridge', depth: 1, base: 0.655, amp: 0.07, wave: 0.7, oct: 4, speed: 0.008, color: 0xb2a7b5, fog: 0.45, rim: true },
        { kind: 'hill', depth: 0.8, base: 0.69, amp: 0.045, wave: 0.5, oct: 3, speed: 0.03, color: 0x9d9b85, fog: 0.4, village: { wall: 0xd1bc95, roof: 0xa9573a } },
        { kind: 'hill', depth: 0.6, base: 0.75, amp: 0.035, wave: 0.45, oct: 3, speed: 0.09, color: 0xbba468, fog: 0.3, rows: true,
          trees: { type: 'round', spacing: 0.03, h: [0.018, 0.03], density: 0.25, groves: 0.5 } },
        { kind: 'hill', depth: 0.4, base: 0.835, amp: 0.03, wave: 0.4, oct: 3, speed: 0.25, color: 0xa98c4e, fog: 0.2, rows: true,
          trees: { type: 'round', spacing: 0.06, h: [0.05, 0.08], density: 0.18 } },
        { kind: 'ground', depth: 0.08, base: 0.945, amp: 0.02, wave: 0.3, oct: 3, speed: 1, color: 0x8c6c3a, path: 0xb39568,
          grass: { spacing: 0.0042, h: [0.018, 0.045], density: 0.85, light: 0.5 },
          flowers: { colors: [0xd8352a, 0xd8352a, 0xe2462e, 0xf0d050], density: 0.16 } },
      ],
      overlay: null,
    },
  };

  // ---------- elevation levels ----------
  // Mountain biomes come in three heights. A level reshapes the same biome instead of duplicating it:
  // relief, snow, and how thin and coniferous the forest gets towards the tree line.
  const LEVELED_BIOMES = ['mountains', 'forest'];
  const LEVELS = {
    low: { relief: 0.4, snow: -1, treeDensity: 1.1, pineShare: 0, cabins: 1.3 },
    mid: { relief: 1, snow: 0, treeDensity: 1, pineShare: 0, cabins: 1 },
    high: { relief: 1.4, snow: 0.22, treeDensity: 0.5, pineShare: 0.5, cabins: 0.4 },
  };
  function biomeAt(id, levelId) {
    const def = BIOMES[id];
    if (!LEVELED_BIOMES.includes(id) || levelId === 'mid') return def;
    const L = { ...LEVELS[levelId], ...(def.levels?.[levelId] ?? {}) };
    const kept = L.dropRidges ? def.layers.filter((layer) => layer === 'lake' || layer.kind !== 'ridge') : def.layers;
    const layers = kept.map((layer) => {
      if (layer === 'lake' || layer.kind === 'ground') return layer;
      const next = { ...layer };
      if (layer.kind !== 'ground') next.amp = layer.amp * (layer.depth > 0.3 ? L.relief : Math.sqrt(L.relief));
      if (layer.kind === 'ridge') {
        // Far ridges gain (or lose) snow; at the low level there is none at all.
        const snow = L.snow < 0 ? 0 : (layer.snow ?? (levelId === 'high' && layer.faces ? 0.2 : 0)) + L.snow;
        if (snow > 0) next.snow = Math.min(0.85, snow); else delete next.snow;
      }
      if (layer.trees) {
        // Towards the tree line the forest thins out, the trees get shorter and conifers take over.
        const high = levelId === 'high' && layer.depth > 0.3;
        next.trees = {
          ...layer.trees,
          density: Math.min(1, layer.trees.density * (high ? L.treeDensity : 1)),
          h: high ? layer.trees.h.map((x) => x * 0.8) : layer.trees.h,
          mix: layer.trees.type === 'round' ? Math.min(1, (layer.trees.mix ?? 0) + L.pineShare) : layer.trees.mix,
        };
      }
      if (layer.cabins) next.cabins = { ...layer.cabins, chance: Math.min(1, layer.cabins.chance * L.cabins) };
      return next;
    });
    // mistAfter points at layer positions; shift it when layers were dropped.
    const dropped = def.layers.length - kept.length;
    const mistAfter = dropped ? def.mistAfter.map((i) => i - dropped).filter((i) => i >= 0) : def.mistAfter;
    return { ...def, layers, mistAfter };
  }

  // ---------- app ----------
  const app = new Application();
  await app.init({
    resizeTo: host, antialias: true, backgroundColor: 0x0b0e1a,
    resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true,
  });
  host.appendChild(app.canvas);
  // Film grain and vignette sit over the canvas (see docs/style-guide.md, "Rendering conventions").
  const overlays = [];
  const addOverlay = (css) => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;inset:0;pointer-events:none;' + css; host.appendChild(d); overlays.push(d); return d; };
  addOverlay('background:radial-gradient(ellipse at 50% 42%, transparent 50%, rgba(10,6,20,0.38) 100%)');
  const grainLayer = addOverlay('opacity:0.07;mix-blend-mode:overlay');

  let W = 0, H = 0, S = 1, MARGIN = 0, unit = 1;
  // On a phone held upright the scene is drawn as a landscape stage that fits the screen's width, with
  // extra sky above it and extra ground below it (see layout()). ABOVE and BELOW are those bands, in px.
  let ABOVE = 0, BELOW = 0;
  // The screen size the layout was made for; H is the stage's height, which on an upright phone is less.
  let laidOutW = 0, laidOutH = 0;
  // Ground scroll speed in screen-heights per second; ~25 km per in-game day of walking.
  const WALK_U_PER_S = 0.045;
  const KM_PER_U = 9;
  // The traveller is drawn in units of H/850, so the ground moves WALK_U_PER_S*850 units/s.
  // Stride and cycle length are matched to that speed so planted feet do not slide.
  const STRIDE = 15;
  // In a gale he takes steps this much shorter, and quicker to match, so his pace and planted feet stay the same.
  const GALE_STRIDE_CUT = 0.22;
  const galeStride = (gale) => 1 - GALE_STRIDE_CUT * gale;
  const TENT_SCALE = 2.1;
  const CYCLE_S = (2 * STRIDE) / (0.6 * WALK_U_PER_S * 850);

  const DEMO_WALK = { startHour: 7.2, endHour: 19.3 };
  const CLEAR_WEATHER = { sky: 'clear', precipitation: 'none', storm: false, wind: 'breeze', frost: false };
  const state = {
    hour: options.hour ?? 18.3, auto: options.auto ?? false, dayLength: options.dayLengthSeconds ?? 120, t: options.animationTime ?? 0, day: 12,
    offsetU: 0, speed: 1, phase: 0,
    biome: options.biome ?? 'baltic', level: options.level ?? 'mid', seed: options.seed ?? 7,
    still: options.still ?? false, hideWanderer: options.hideWanderer ?? false, beard: options.beard ?? 0.2,
    // Today's walk: from `startHour` to `endHour`, after `leadHours` of getting up and packing. Null is a
    // day at camp (no steps yet, or a rest day). Without a walk given, the demo day of the prototype.
    walk: options.walk === undefined ? DEMO_WALK : options.walk,
    weather: options.weather ?? CLEAR_WEATHER,
  };

  // ---------- textures ----------
  function radialTex(size, stops) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([o, a]) => g.addColorStop(o, `rgba(255,255,255,${a})`));
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    return Texture.from(c);
  }
  function verticalTex(stops) {
    const c = document.createElement('canvas'); c.width = 2; c.height = 128;
    const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 128);
    stops.forEach(([o, a]) => g.addColorStop(o, `rgba(255,255,255,${a})`));
    x.fillStyle = g; x.fillRect(0, 0, 2, 128);
    return Texture.from(c);
  }
  function rayTexture() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64;
    const x = c.getContext('2d');
    const gx = x.createLinearGradient(0, 0, 256, 0);
    gx.addColorStop(0, 'rgba(255,255,255,0)'); gx.addColorStop(0.08, 'rgba(255,255,255,1)'); gx.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gx; x.fillRect(0, 0, 256, 64);
    x.globalCompositeOperation = 'destination-in';
    const gy = x.createLinearGradient(0, 0, 0, 64);
    gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.5, 'rgba(0,0,0,1)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gy; x.fillRect(0, 0, 256, 64);
    return Texture.from(c);
  }
  (function grain() {
    const c = document.createElement('canvas'); c.width = c.height = 180;
    const x = c.getContext('2d'); const img = x.createImageData(180, 180);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    grainLayer.style.backgroundImage = `url(${c.toDataURL()})`;
  })();

  const glowTex = radialTex(256, [[0, 1], [0.2, 0.55], [0.5, 0.17], [1, 0]]);
  const blobTex = radialTex(128, [[0, 1], [0.55, 0.85], [0.8, 0.35], [1, 0]]);
  const puffTex = radialTex(128, [[0, 0.9], [0.5, 0.45], [1, 0]]);
  const dotTex = radialTex(32, [[0, 1], [0.3, 0.8], [1, 0]]);
  const fogTex = verticalTex([[0, 0], [0.45, 1], [1, 1]]);
  const sheenTex = verticalTex([[0, 1], [1, 0]]);
  const rayTex = rayTexture();
  // Lighthouse beam: narrow at the lamp, widening to a cone and then running parallel, fading with distance.
  // Soft edges come from stacking translucent cones, which also works where canvas blur filters do not.
  function beamTexture() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128;
    const x = c.getContext('2d'), mid = 64;
    for (let i = 0; i < 12; i++) {
      const k = 1 - i / 12, spread = 60 * k, start = 3 * k + 1;
      x.beginPath();
      x.moveTo(0, mid - start); x.lineTo(300, mid - spread); x.lineTo(512, mid - spread);
      x.lineTo(512, mid + spread); x.lineTo(300, mid + spread); x.lineTo(0, mid + start);
      x.closePath(); x.fillStyle = 'rgba(255,255,255,0.11)'; x.fill();
    }
    x.globalCompositeOperation = 'destination-in';
    const g = x.createLinearGradient(0, 0, 512, 0);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 512, 128);
    return Texture.from(c);
  }
  const beamTex = beamTexture();

  const skyCanvas = document.createElement('canvas'); skyCanvas.width = 2; skyCanvas.height = 256;
  const skyCtx = skyCanvas.getContext('2d');
  const skyTex = Texture.from(skyCanvas);
  function paintSky(P) {
    const g = skyCtx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, css(P.top));
    g.addColorStop(0.5, css(mix(P.top, P.hor, 0.45)));
    g.addColorStop(0.72, css(P.hor));
    g.addColorStop(1, css(mix(P.hor, P.haze, 0.5)));
    skyCtx.fillStyle = g; skyCtx.fillRect(0, 0, 2, 256);
    skyTex.source.update();
  }

  const addSprite = (parent, tex, { anchor = 0.5, add = false, tint } = {}) => {
    const s = new Sprite(tex); s.anchor.set(anchor);
    if (add) s.blendMode = 'add';
    if (tint !== undefined) s.tint = tint;
    parent.addChild(s); return s;
  };

  // ---------- scene graph ----------
  const skyGroup = new Container();
  const landscape = new Container();
  const veilC = new Container();
  const actors = new Container();
  const front = new Container();
  // Rain or snow falls in front of everything, and a lightning flash lights the whole picture.
  const precipG = new Graphics();
  // Gusts blow across in front of the land and the wanderer, behind the falling rain.
  const gustG = new Graphics();
  const flash = new Sprite(Texture.WHITE);
  flash.blendMode = 'add';
  app.stage.addChild(skyGroup, landscape, veilC, actors, front, gustG, precipG, flash);

  const sky = new Sprite(skyTex); skyGroup.addChild(sky);
  // The sky above the stage on an upright phone: the zenith colour, continued upwards.
  const skyAbove = new Sprite(Texture.WHITE); skyGroup.addChild(skyAbove);
  const milky = addSprite(skyGroup, glowTex, { add: true, tint: 0xc4ccff });
  const starsC = new Container(); skyGroup.addChild(starsC);
  const shootG = new Graphics(); skyGroup.addChild(shootG);
  const moon = new Container(); skyGroup.addChild(moon);
  const moonGlow = addSprite(moon, glowTex, { add: true, tint: 0xaab8ff });
  const moonDisc = new Graphics().circle(0, 0, 50).fill(0xf3efe2)
    .circle(-14, -10, 12).fill({ color: 0xd6cfbd, alpha: 0.7 })
    .circle(16, 8, 9).fill({ color: 0xd6cfbd, alpha: 0.6 })
    .circle(4, 22, 6).fill({ color: 0xd6cfbd, alpha: 0.5 });
  moon.addChild(moonDisc);
  const sunHalo = addSprite(skyGroup, glowTex, { add: true });
  const sunGlow = addSprite(skyGroup, glowTex, { add: true });
  const sunDisc = new Graphics().circle(0, 0, 50).fill(0xffffff); skyGroup.addChild(sunDisc);
  const cloudsC = new Container(); skyGroup.addChild(cloudsC);
  const birdsG = new Graphics(); skyGroup.addChild(birdsG);
  const sunVeil = addSprite(veilC, glowTex, { add: true });

  let stars = [];
  function buildStars() {
    starsC.removeChildren().forEach(s => s.destroy());
    stars = [];
    const n = Math.min(420, Math.round(W * (H + ABOVE) / 3600));
    for (let i = 0; i < n; i++) {
      const s = addSprite(starsC, dotTex);
      let x, y;
      if (i % 5 < 2) {
        // Concentrate some stars along the Milky Way band.
        const t = Math.random();
        x = t * W; y = H * 0.12 + t * H * 0.32 + (Math.random() - 0.5) * H * 0.12;
      } else { x = Math.random() * W; y = Math.random() * (H * 0.62 + ABOVE) - ABOVE; }
      s.position.set(x, y);
      s.width = s.height = Math.pow(Math.random(), 3) * 3.2 + 1.2;
      stars.push({ s, base: 0.35 + Math.random() * 0.65, f: 0.5 + Math.random() * 2.5, ph: Math.random() * 6.28 });
    }
  }

  let clouds = [];
  // Fewer clouds on a clear day, the biome's usual number when it is partly cloudy, a crowded sky when
  // overcast or foggy.
  function cloudCount(def) {
    const sky = state.weather.sky;
    return sky === 'clear' ? Math.ceil(def.clouds * 0.6) : sky === 'partly' ? def.clouds : def.clouds * 2 + 4;
  }

  function buildClouds(def) {
    cloudsC.removeChildren().forEach(c => c.destroy({ children: true }));
    clouds = [];
    const band = cloudBand(state.weather.sky);
    for (let i = 0; i < cloudCount(def); i++) {
      const r0 = hash(i, state.seed + 300), r1 = hash(i, state.seed + 301), r2 = hash(i, state.seed + 302);
      const c = new Container();
      const shade = new Graphics(), body = new Graphics(), hi = new Graphics();
      const cw = (0.1 + r0 * 0.22) * S * band.size, ch = cw * (0.22 + r2 * 0.1);
      const n = 6 + Math.floor(r1 * 6);
      for (let b = 0; b < n; b++) {
        const f = (b + 0.5) / n;
        const r = ch * (0.28 + 0.62 * Math.pow(Math.sin(f * Math.PI), 0.8)) * (0.75 + hash(b, i * 13 + state.seed) * 0.5);
        const x = (f - 0.5) * cw * 0.9 + (hash(b, i * 17 + state.seed) - 0.5) * ch * 0.3;
        body.circle(x, -r, r).fill(0xffffff);
        shade.circle(x, -r + ch * 0.1, r).fill(0xffffff);
        hi.circle(x - r * 0.12, -r * 1.18, r * 0.72).fill(0xffffff);
      }
      body.roundRect(-cw / 2, -ch * 0.3, cw, ch * 0.3, ch * 0.15).fill(0xffffff);
      shade.roundRect(-cw / 2, -ch * 0.2, cw, ch * 0.3, ch * 0.15).fill(0xffffff);
      c.addChild(shade, body, hi);
      c.y = (band.top + r2 * band.spread) * H;
      cloudsC.addChild(c);
      clouds.push({ c, body, shade, hi, cw, base: r1, speed: 3 + r0 * 6 });
    }
  }

  // ---------- landscape ----------
  let env = null;

  function heightAt(L, u) {
    let h = fbm(u / L.wave, L.seed, L.oct, L.ridged, L.angular);
    h = clamp((h - 0.25) / 0.6);
    if (L.sharp) h = Math.pow(h, L.sharp);
    return h;
  }
  function yAt(L, sx, uOff) {
    const u = sx / S + uOff;
    if (L.kind === 'overlay') return H + 6 - Math.max(0, heightAt(L, u) - 0.58) * H * 0.3 * (L.rise ?? 1);
    return (L.base - L.amp * heightAt(L, u)) * H;
  }
  const layerOffset = L => state.offsetU * L.speed + L.shift;

  // Trees, cabins and mountain faces are split into a left and a right half so each side
  // can be tinted lit or shaded depending on where the sun or moon is.
  function pineHalves(gl, gr, x, y, h) {
    const w = h * 0.36, tiers = 4;
    const tierY = i => y - h + h * 0.92 * i / tiers;
    const tierW = i => w * (0.35 + 0.65 * i / tiers) * 0.5;
    for (const [g, sd] of [[gl, -1], [gr, 1]]) {
      const p = [x, y - h];
      for (let i = 1; i <= tiers; i++) {
        p.push(x + sd * tierW(i), tierY(i));
        if (i < tiers) p.push(x + sd * tierW(i) * 0.42, tierY(i) - h * 0.05);
      }
      p.push(x + sd * w * 0.05, y - h * 0.08, x + sd * w * 0.05, y + 2, x, y + 2);
      g.poly(p).fill(0xffffff);
    }
  }
  function halfDisk(g, cx, cy, r, sd, n, squash = 1) {
    const ry = r * squash, p = [cx, cy - ry];
    for (let i = 1; i < n; i++) {
      const a = -Math.PI / 2 + sd * Math.PI * i / n;
      p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * ry);
    }
    p.push(cx, cy + ry);
    g.poly(p).fill(0xffffff);
  }
  function roundHalves(gl, gr, x, y, h, r) {
    const tw = Math.max(1.2, h * 0.06);
    gl.rect(x - tw / 2, y - h * 0.5, tw / 2, h * 0.5 + 2).fill(0xffffff);
    gr.rect(x, y - h * 0.5, tw / 2, h * 0.5 + 2).fill(0xffffff);
    const cr = h * 0.27, n = h > H * 0.04 ? 10 : 6;
    const blobs = [[x, y - h * 0.64, cr], [x - cr * 0.62, y - h * 0.5, cr * 0.72], [x + cr * 0.64, y - h * 0.53, cr * 0.68], [x + cr * 0.3 * (r - 0.5), y - h * 0.82, cr * 0.66]];
    for (const [cx, cy, rr] of blobs) halfDisk(gl, cx, cy, rr, -1, n);
    for (const [cx, cy, rr] of blobs) halfDisk(gr, cx, cy, rr, 1, n);
  }
  // Birch: a slender white trunk with dark marks, visible high up, under a narrow, airy crown of small
  // clumps. The trunk and marks go to their own graphics so they stay white and black in any light.
  function birchHalves(gl, gr, bark, marks, x, y, h, r) {
    const tw = Math.max(1, h * 0.035), lean = (r - 0.5) * h * 0.08;
    // The trunk ends inside the crown, so it never shows through the leaves.
    bark.poly([x - tw / 2, y + 2, x + tw / 2, y + 2, x + lean * 0.45 + tw * 0.35, y - h * 0.45, x + lean * 0.45 - tw * 0.35, y - h * 0.45]).fill(0xffffff);
    for (let i = 0; i < 3; i++) {
      const f = 0.1 + i * 0.11 + hash(i, Math.round(x * 7)) * 0.04, mx = x + lean * f;
      marks.rect(mx - tw * 0.5, y - h * f, tw * (0.5 + 0.5 * hash(i + 4, Math.round(x * 7))), Math.max(0.8, tw * 0.35)).fill(0xffffff);
    }
    const cr = h * 0.13, n = 6;
    const blobs = [[0.95, 0], [0.82, -0.7], [0.8, 0.7], [0.66, -0.9], [0.64, 0.8], [0.52, -0.4], [0.5, 0.5]];
    for (const [f, o] of blobs) {
      const cx = x + lean * f + o * cr, cy = y - h * f, rr = cr * (0.75 + 0.35 * hash(Math.round(f * 100), Math.round(x * 3)));
      halfDisk(gl, cx, cy, rr, -1, n); halfDisk(gr, cx, cy, rr, 1, n);
    }
  }
  // Coastal pine: a conifer like a spruce but looser. The lower third of the trunk is bare and drawn in its
  // own rust-brown (`bark`), the tiers are uneven and set high, and the whole tree leans a little away
  // from the sea wind.
  function coastPineHalves(gl, gr, bark, x, y, h, r) {
    const tw = Math.max(1.4, h * 0.04), lean = (r - 0.5) * h * 0.12;
    const base = 0.36, tiers = 5;
    const at = f => x + lean * f;
    // The trunk stops where the lowest tier starts, so it never shows through the needles.
    bark.poly([x - tw / 2, y + 2, x + tw / 2, y + 2, at(base) + tw * 0.3, y - h * base, at(base) - tw * 0.3, y - h * base]).fill(0xffffff);
    const wMax = h * 0.3;
    for (const [g, sd] of [[gl, -1], [gr, 1]]) {
      const p = [at(1), y - h];
      for (let i = 1; i <= tiers; i++) {
        const f = 1 - (1 - base) * i / tiers;
        const jag = 0.75 + 0.5 * hash(i * 2 + (sd > 0 ? 1 : 0), Math.round(x * 13 + r * 997));
        const wv = wMax * (0.3 + 0.7 * i / tiers) * jag;
        p.push(at(f) + sd * wv, y - h * f);
        if (i < tiers) p.push(at(f) + sd * wv * 0.45, y - h * (f + 0.035));
      }
      p.push(at(base), y - h * (base - 0.01));
      g.poly(p).fill(0xffffff);
    }
  }
  // Lombardy poplar: a tall, narrow column of foliage on a short trunk, as along Polish field roads.
  function poplarHalves(gl, gr, x, y, h) {
    const tw = Math.max(1.2, h * 0.05);
    gl.rect(x - tw / 2, y - h * 0.2, tw / 2, h * 0.2 + 2).fill(0xffffff);
    gr.rect(x, y - h * 0.2, tw / 2, h * 0.2 + 2).fill(0xffffff);
    for (const [cy, r] of [[0.55, 0.13], [0.36, 0.11], [0.74, 0.1], [0.88, 0.07]]) {
      halfDisk(gl, x, y - h * cy, h * r, -1, 8, 2.1);
      halfDisk(gr, x, y - h * cy, h * r, 1, 8, 2.1);
    }
  }
  function drawTrees(L, uOff, x1) {
    const T = L.trees;
    const k0 = Math.floor((uOff - 0.1) / T.spacing), k1 = Math.ceil((uOff + x1 / S + 0.1) / T.spacing);
    for (let k = k0; k <= k1; k++) {
      if (!T.avenue && hash(k, L.seed + 17) > T.density) continue;
      // An avenue runs in stretches along a road: trees evenly spaced, with long gaps between avenues.
      if (T.avenue && noise1((k * T.spacing) / T.avenue, L.seed + 19) < 1 - (T.avenueShare ?? 0.38)) continue;
      const u = (k + (T.avenue ? 0 : hash(k, L.seed + 29) * 0.8)) * T.spacing;
      if (T.groves && noise1(u / 0.22, L.seed + 5) < T.groves) continue;
      const sx = (u - uOff) * S;
      if (L.jettySpans?.some(([from, to]) => sx > from && sx < to)) continue;
      const h = lerp(T.h[0], T.h[1], hash(k, L.seed + 41)) * H;
      const y = yAt(L, sx, uOff) + h * 0.04;
      const isPine = T.mix ? hash(k, L.seed + 53) < T.mix : T.type === 'pine';
      if (T.type === 'poplar') poplarHalves(L.tL, L.tR, sx, y, h);
      else if (T.type === 'coastpine') coastPineHalves(L.tL, L.tR, L.bark, sx, y, h, hash(k, L.seed + 67));
      else if (isPine) pineHalves(L.tL, L.tR, sx, y, h * (T.type === 'round' ? 1.25 : 1));
      else if (T.birch && hash(k, L.seed + 57) < T.birch) birchHalves(L.tL, L.tR, L.bark, L.barkMarks, sx, y, h * 1.15, hash(k, L.seed + 67));
      else roundHalves(L.tL, L.tR, sx, y, h, hash(k, L.seed + 67));
    }
  }
  function house(L, sx, y, s, opts = {}) {
    const w = s * (opts.w || 2.2), hh = s * (opts.h || 1.3);
    L.walls.rect(sx - w / 2, y - hh, w, hh + 2).fill(0xffffff);
    if (opts.planks) for (let k = 1; k < 4; k++) L.planks.rect(sx - w / 2, y - hh + hh * k / 4, w, Math.max(0.6, s * 0.06)).fill(0xffffff);
    L.roofs.poly([sx - w / 2 - s * 0.25, y - hh, sx, y - hh - s * (opts.roof || 1.1), sx + w / 2 + s * 0.25, y - hh]).fill(0xffffff);
    if (opts.chimney) L.roofs.rect(sx + w * 0.2, y - hh - s * 0.95, s * 0.28, s * 0.6).fill(0xffffff);
    const ws = s * 0.36;
    if (opts.windows !== 0) {
      L.win.rect(sx - w * 0.3, y - hh * 0.68, ws, ws).fill(0xffffff);
      if (w > s * 1.6) L.win.rect(sx + w * 0.3 - ws, y - hh * 0.68, ws, ws).fill(0xffffff);
    }
  }
  function drawCabins(L, uOff, x1) {
    const C = L.cabins;
    const k0 = Math.floor((uOff - 0.2) / C.spacing), k1 = Math.ceil((uOff + x1 / S + 0.2) / C.spacing);
    for (let k = k0; k <= k1; k++) {
      if (hash(k, L.seed + 201) > C.chance) continue;
      const u = (k + 0.2 + hash(k, L.seed + 202) * 0.6) * C.spacing;
      const sx = (u - uOff) * S;
      house(L, sx, yAt(L, sx, uOff) + 2, C.size * H, { chimney: true, planks: true });
    }
  }
  // A Polish village house in one of two kinds: gable end to the road (narrow, steep roof, the long side
  // in shade going back) or eaves to the road (wide, a low hipped roof). White walls, red roofs, a chimney
  // and small windows; `r` picks the kind and its proportions.
  function villageHouse(L, sx, y, s, r) {
    const [r1, r2, r3, r4] = r;
    if (r1 < 0.45) {
      const w = s * (1.15 + 0.3 * r2), h = s * (0.95 + 0.25 * r3), side = s * (0.9 + 0.5 * r4), roofH = s * 1.05;
      L.planks.poly([sx + w / 2, y - h, sx + w / 2 + side, y - h - s * 0.12, sx + w / 2 + side, y + 1, sx + w / 2, y + 1]).fill(0xffffff);
      L.roofs.poly([sx, y - h - roofH, sx + side, y - h - roofH - s * 0.12, sx + w / 2 + side + s * 0.12, y - h - s * 0.12, sx + w / 2 + s * 0.12, y - h]).fill(0xffffff);
      L.walls.poly([sx - w / 2, y + 1, sx - w / 2, y - h, sx, y - h - roofH * 0.92, sx + w / 2, y - h, sx + w / 2, y + 1]).fill(0xffffff);
      L.roofs.poly([sx - w / 2 - s * 0.12, y - h + s * 0.02, sx, y - h - roofH, sx + s * 0.08, y - h - roofH + s * 0.14, sx - w / 2 + s * 0.02, y - h + s * 0.14]).fill(0xffffff);
      L.win.rect(sx - s * 0.2, y - h * 0.62, s * 0.4, s * 0.38).fill(0xffffff);
      if (r4 > 0.5) L.win.rect(sx - s * 0.1, y - h - roofH * 0.55, s * 0.2, s * 0.22).fill(0xffffff);
      L.roofs.rect(sx + side * 0.55, y - h - roofH - s * 0.25, s * 0.22, s * 0.4).fill(0xffffff);
    } else {
      const w = s * (2.1 + 0.7 * r2), h = s * (0.9 + 0.2 * r3), roofH = s * (0.75 + 0.2 * r4);
      L.walls.rect(sx - w / 2, y - h, w, h + 1).fill(0xffffff);
      L.roofs.poly([sx - w / 2 - s * 0.18, y - h, sx - w / 2 + s * 0.55, y - h - roofH, sx + w / 2 - s * 0.55, y - h - roofH, sx + w / 2 + s * 0.18, y - h]).fill(0xffffff);
      for (const f of [-0.28, 0.28]) L.win.rect(sx + w * f - s * 0.19, y - h * 0.66, s * 0.38, s * 0.38).fill(0xffffff);
      L.planks.rect(sx - s * 0.18, y - h * 0.62, s * 0.36, h * 0.62 + 1).fill(0xffffff);
      L.roofs.rect(sx + w * 0.22, y - h - roofH - s * 0.2, s * 0.22, s * 0.45).fill(0xffffff);
    }
  }
  // Brick Gothic church: a long nave with buttresses and tall pointed windows under a steep roof, and a
  // square west tower with a cornice and a tall spire, all in the brick tint.
  function villageChurch(L, cx, y, s) {
    const nave = [cx - s * 2.2, cx + s * 1.3], naveH = s * 2.0;
    L.church.rect(nave[0], y - naveH, nave[1] - nave[0], naveH + 1).fill(0xffffff);
    for (let i = 0; i <= 3; i++) {
      const bx = lerp(nave[0], nave[1], i / 3);
      L.planks.rect(bx - s * 0.11, y - naveH * 0.8, s * 0.22, naveH * 0.8 + 1).fill(0xffffff);
      if (i < 3) {
        const wx = lerp(nave[0], nave[1], (i + 0.5) / 3);
        L.win.poly([wx - s * 0.16, y - naveH * 0.25, wx - s * 0.16, y - naveH * 0.7, wx, y - naveH * 0.85, wx + s * 0.16, y - naveH * 0.7, wx + s * 0.16, y - naveH * 0.25]).fill(0xffffff);
      }
    }
    L.roofs.poly([nave[0] - s * 0.15, y - naveH, (nave[0] + nave[1]) / 2, y - naveH - s * 1.35, nave[1] + s * 0.15, y - naveH]).fill(0xffffff);
    const t0 = nave[1] - s * 0.1, tw = s * 1.25, tH = s * 4.6;
    L.church.rect(t0, y - tH, tw, tH + 1).fill(0xffffff);
    L.planks.rect(t0 + tw * 0.62, y - tH, tw * 0.38, tH + 1).fill(0xffffff);
    L.church.rect(t0 - s * 0.1, y - tH - s * 0.18, tw + s * 0.2, s * 0.2).fill(0xffffff);
    L.win.poly([t0 + tw * 0.3, y - tH * 0.62, t0 + tw * 0.3, y - tH * 0.8, t0 + tw * 0.42, y - tH * 0.86, t0 + tw * 0.54, y - tH * 0.8, t0 + tw * 0.54, y - tH * 0.62]).fill(0xffffff);
    L.roofs.poly([t0 - s * 0.05, y - tH - s * 0.18, t0 + tw / 2, y - tH - s * 2.6, t0 + tw + s * 0.05, y - tH - s * 0.18]).fill(0xffffff);
    L.roofs.rect(t0 + tw / 2 - s * 0.04, y - tH - s * 3.05, s * 0.08, s * 0.5).fill(0xffffff);
    L.roofs.rect(t0 + tw / 2 - s * 0.2, y - tH - s * 2.92, s * 0.4, s * 0.07).fill(0xffffff);
  }
  // A small flat-roofed corner shop at the end of the village street: a wide shop window, a glass door and
  // a green neon fascia reading "Ropucha" (a toad, not any real chain), glowing from dusk.
  // Drawn a little larger than the houses (a modern pavilion whose sign must still be readable here).
  function villageShop(L, sx, y, houseS) {
    const s = houseS * 1.25, w = s * 4, h = s * 1.4;
    L.walls.rect(sx - w / 2, y - h, w, h + 1).fill(0xffffff);
    L.planks.rect(sx - w / 2 - s * 0.08, y - h - s * 0.12, w + s * 0.16, s * 0.14).fill(0xffffff);
    L.win.rect(sx - w * 0.42, y - h * 0.6, w * 0.56, h * 0.48).fill(0xffffff);
    L.win.rect(sx + w * 0.22, y - h * 0.62, w * 0.16, h * 0.62).fill(0xffffff);
    // The sign stands on the roof as a lit box, wider than the shop window and tall enough to read.
    const signY = y - h - s * 0.8, signH = s * 0.72;
    L.planks.rect(sx - w * 0.3, signY + signH, s * 0.12, s * 0.8 - signH + s * 0.72).fill(0xffffff);
    L.planks.rect(sx + w * 0.3 - s * 0.12, signY + signH, s * 0.12, s * 0.8 - signH + s * 0.72).fill(0xffffff);
    L.neonGlow.roundRect(sx - w / 2 - s * 0.35, signY - s * 0.3, w + s * 0.7, signH + s * 0.6, s * 0.4).fill(0xffffff);
    L.neon.rect(sx - w / 2 + s * 0.06, signY, w - s * 0.12, signH).fill(0xffffff);
    const label = new Text({
      text: 'ROPUCHA',
      style: { fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: '900', fontSize: signH * 0.72, fill: 0xffffff, letterSpacing: s * 0.03 },
    });
    label.anchor.set(0.5);
    label.position.set(sx, signY + signH / 2);
    label.resolution = 3;
    L.shopTexts.addChild(label);
  }
  function drawVillage(L, uOff, x1) {
    const spacing = L.village.spacing ?? 2.6;
    const k0 = Math.floor((uOff - 0.3) / spacing), k1 = Math.ceil((uOff + x1 / S + 0.3) / spacing);
    for (let k = k0; k <= k1; k++) {
      if (hash(k, L.seed + 3) > 0.75) continue;
      const cu = (k + 0.3 + hash(k, L.seed + 4) * 0.4) * spacing;
      const s = H * 0.011 * (L.village.scale ?? 1);
      const n = 6 + Math.floor(hash(k, L.seed + 6) * 6);
      const cx = (cu - uOff) * S;
      // Houses strung out along the road either side of the church, with yards between them and trees
      // behind; the church stands in the middle.
      for (let i = 0; i < n; i++) {
        const side = i % 2 ? 1 : -1, rank = Math.floor(i / 2) + 1;
        const sx = cx + side * (s * 2.6 + rank * s * 3.2 + (hash(i, k + L.seed) - 0.5) * s * 1.2);
        const y = yAt(L, sx, uOff) + 1;
        if (hash(i, k * 7 + L.seed) < 0.75) roundHalves(L.tL, L.tR, sx + side * s * 1.7, y + 1, s * (2.4 + hash(i, k * 9 + L.seed) * 1.2), hash(i, k * 11 + L.seed));
        villageHouse(L, sx, y, s, [hash(i, k * 3 + 1), hash(i, k * 3 + 2), hash(i, k * 3 + 3), hash(i, k * 3 + 4)]);
      }
      const natural = hash(k, L.seed + 12) < L.village.shops;
      if (L.village.shops && (state.allShops || natural)) {
        // At the end of the street on the right, just past the last house.
        const sx = cx + s * 2.6 + (Math.ceil(n / 2) + 1.2) * s * 3.2;
        villageShop(L, sx, yAt(L, sx, uOff) + 1, s);
        L.shops.push({ u: sx / S + uOff, natural });
      }
      const y = yAt(L, cx, uOff) + 1;
      roundHalves(L.tL, L.tR, cx - s * 3, y + 1, s * 3.4, hash(k, L.seed + 8));
      if (L.village.church) { villageChurch(L, cx, y, s); continue; }
      villageHouse(L, cx, y, s * 1.2, [0.9, 0.6, 0.5, 0.5]);
    }
  }
  function findPeaks(ys, win) {
    const peaks = [];
    for (let i = 1; i < ys.length - 1; i++) {
      let ok = true;
      for (let j = Math.max(0, i - win); j <= Math.min(ys.length - 1, i + win) && ok; j++) {
        if ((j < i && ys[j] <= ys[i]) || (j > i && ys[j] < ys[i])) ok = false;
      }
      if (ok) peaks.push(i);
    }
    return peaks;
  }
  // Classic two-tone mountains: each peak gets a crease running down from the summit,
  // splitting it into a left and a right face, plus a few gullies for rock texture.
  function drawFaces(L, xs, ys) {
    const side = new Int8Array(xs.length).fill(-1);
    const step = xs[1] - xs[0];
    const peaks = findPeaks(ys, Math.max(2, Math.round(L.wave * 0.16 * H / step)));
    if (!peaks.length) return side;
    const argmax = (a, b) => { let m = a; for (let i = a; i <= b; i++) if (ys[i] > ys[m]) m = i; return m; };
    const valleys = [argmax(0, peaks[0])];
    for (let k = 0; k < peaks.length - 1; k++) valleys.push(argmax(peaks[k], peaks[k + 1]));
    valleys.push(argmax(peaks[peaks.length - 1], xs.length - 1));
    const bottom = H + BELOW + 20, baseY = L.base * H;
    // Where two mountains meet, the seam runs down the valley floor as a winding line, shared by the face
    // on either side, instead of dropping plumb from the col.
    const seams = valleys.map((v) => {
      const pts = [], top = ys[v], drift = leaning(hash(v + Math.round(xs[v]), L.seed + 94), 0.12, 0.3);
      for (let j = 1; j <= 12; j++) {
        const t = j / 12, y = top + (bottom - top) * t;
        const wobble = (noise1(j * 0.8 + xs[v] * 0.013, L.seed + 96) - 0.5) * H * 0.025 * Math.min(1, t * 3);
        pts.push(xs[v] + drift * (y - top) + wobble, y);
      }
      return pts;
    });
    // A slope from a hash, never near zero, so no line ever drops straight down: magnitude min..max, either way.
    function leaning(h, min, max) { return (h < 0.5 ? -1 : 1) * (min + (max - min) * Math.abs(h - 0.5) * 2); }
    const reversed = (pts) => { const out = []; for (let j = pts.length - 2; j >= 0; j -= 2) out.push(pts[j], pts[j + 1]); return out; };
    for (let k = 0; k < peaks.length; k++) {
      const p = peaks[k], vl = valleys[k], vr = valleys[k + 1];
      const px = xs[p], py = ys[p];
      // The crease between the lit and the shaded face runs down a spur from the summit: steep at first,
      // then bending away as the spur flattens towards the foot, so a face never reads as a flat panel
      // cut by a plumb line.
      const lean = leaning(hash(Math.round(px * 7), L.seed + 91), 0.2, 0.6);
      const bend = leaning(hash(Math.round(px * 7), L.seed + 92), 0.3, 0.8);
      const foot = Math.max(1, baseY - py);
      const crease = [];
      const m = 16;
      for (let j = 1; j <= m; j++) {
        const t = j / m, y = py + (bottom - py) * t, down = Math.min(1, (y - py) / foot);
        const wobble = (noise1(j * 0.9 + px * 0.01, L.seed + 93) - 0.5) * H * 0.02 * Math.min(1, t * 4);
        crease.push(px + lean * (y - py) * 0.45 + bend * down * down * foot * 0.5 + wobble, y);
      }
      const left = [];
      for (let i = vl; i <= p; i++) left.push(xs[i], ys[i]);
      left.push(...crease, ...reversed(seams[k]));
      L.shL.poly(left).fill(0xffffff);
      const right = [px, py];
      for (let i = p + 1; i <= vr; i++) right.push(xs[i], ys[i]);
      right.push(...seams[k + 1]);
      right.push(...reversed(crease));
      L.shR.poly(right).fill(0xffffff);
      for (let i = p + 1; i <= vr; i++) side[i] = 1;

      // Couloirs: one to three shaded chutes per face, cut down from notches in the ridge. Each is a filled
      // sliver that drifts downhill away from the summit and meanders a little, so it reads as a groove in
      // the rock rather than a crack drawn on it.
      for (const [a, b, sd] of [[vl, p, -1], [p, vr, 1]]) {
        const count = 1 + Math.floor(hash(p * 3 + sd, L.seed + 95) * 2.6);
        for (let g = 0; g < count; g++) {
          const i = Math.round(lerp(a, b, sd < 0 ? 0.25 + 0.55 * hash(p * 11 + g * 5 + sd, L.seed + 97) : 0.2 + 0.55 * hash(p * 11 + g * 5 + sd, L.seed + 97)));
          const x0 = xs[i], y0 = ys[i] + H * 0.006;
          const len = (baseY - y0) * (0.35 + 0.45 * hash(i, L.seed + 99));
          if (len < 6) continue;
          const w0 = Math.max(1.5, len * (0.045 + 0.035 * hash(i, L.seed + 103)));
          const near = [], far = [];
          const n = 10;
          for (let s = 0; s <= n; s++) {
            const q = s / n, y = y0 + len * q;
            const x = x0 + sd * len * 0.14 * q * q + (noise1(q * 2.5 + i * 0.37, L.seed + 101) - 0.5) * len * 0.1 * q;
            // Pointed at both ends: it opens just under the ridge, is widest in its upper third and runs out.
            const half = w0 * Math.min(1, q * 4) * Math.pow(1 - q, 1.3) * (0.85 + 0.3 * noise1(q * 4 + i, L.seed + 105));
            near.push([x - half, y]); far.push([x + half, y]);
          }
          // Half see-through, so a couloir darkens the lit face and the shaded one alike.
          L.gully.poly([...near.flat(), ...far.reverse().flat()]).fill({ color: 0xffffff, alpha: 0.24 });
        }
      }
    }
    return side;
  }
  function drawSnow(L, xs, ys, uOff, side) {
    // Snow lies only above the biome's snow line (a fixed height on screen), so lower ridges stay bare
    // and the highest peaks only get caps; the layer's own snow share can lower it further, never raise it.
    const Ys = Math.min((L.base - L.amp * (1 - L.snow)) * H, (env.def.snowLine ?? 1) * H);
    let run = [], runSide = -1;
    const flush = () => {
      if (run.length >= 2) {
        const pts = [];
        run.forEach(p => pts.push(p[0], p[1]));
        for (let i = run.length - 1; i >= 0; i--) pts.push(run[i][0], run[i][2]);
        (runSide > 0 ? L.sgR : L.sgL).poly(pts).fill(0xffffff);
      }
      run = [];
    };
    for (let i = 0; i < xs.length; i++) {
      const y = ys[i];
      if (y >= Ys) { flush(); continue; }
      const sd = side ? side[i] : -1;
      if (run.length && sd !== runSide) { const last = run[run.length - 1]; flush(); run.push(last); }
      runSide = sd;
      const u = xs[i] / S + uOff;
      const j = (noise1(u * 55, L.seed + 3) - 0.5) * L.amp * H * 0.22 + (noise1(u * 13, L.seed + 9) - 0.5) * L.amp * H * 0.25;
      run.push([xs[i], y, Math.max(y + 0.5, Math.min(Ys + j, y + L.amp * H * 0.35))]);
    }
    flush();
  }
  function drawPath(L, xs, ys, uOff, x1) {
    const pts = [];
    for (let i = 0; i < xs.length; i++) pts.push(xs[i], ys[i] + H * 0.001);
    for (let i = xs.length - 1; i >= 0; i--) {
      const u = xs[i] / S + uOff;
      pts.push(xs[i], ys[i] + H * (0.01 + 0.007 * noise1(u * 6, L.seed + 41)));
    }
    L.pathG.poly(pts).fill(0xffffff);
    const sp = 0.01;
    const k0 = Math.floor((uOff - 0.05) / sp), k1 = Math.ceil((uOff + x1 / S) / sp);
    for (let k = k0; k <= k1; k++) {
      if (hash(k, L.seed + 43) > 0.6) continue;
      const sx = ((k + hash(k, L.seed + 44)) * sp - uOff) * S;
      const y = yAt(L, sx, uOff) + H * (0.003 + hash(k, L.seed + 45) * 0.01);
      const r = H * (0.001 + hash(k, L.seed + 46) * 0.0022);
      L.gully.ellipse(sx, y, r * 1.6, r).fill(0xffffff);
    }
  }
  function drawRows(L, xs, ys, uOff) {
    const inField = i => noise1((xs[i] / S + uOff) / 0.12, L.seed + 61) > 0.45;
    for (let k = 1; k <= 8; k++) {
      const off = H * (0.004 + 0.0042 * Math.pow(k, 1.35)), th = H * 0.0014 * (1 + k * 0.35);
      let a = -1;
      for (let i = 0; i <= xs.length; i++) {
        const on = i < xs.length && inField(i);
        if (on && a < 0) a = i;
        if (!on && a >= 0) {
          if (i - a >= 2) {
            const pts = [];
            for (let j = a; j < i; j++) pts.push(xs[j], ys[j] + off);
            for (let j = i - 1; j >= a; j--) pts.push(xs[j], ys[j] + off + th);
            L.rowG.poly(pts).fill(0xffffff);
          }
          a = -1;
        }
      }
    }
  }

  // Each feature along a layer is placed on a world grid so it stays put while the layer scrolls.
  // Fields seen across flat land: crops lie in soft bands that follow the line of the land, one under
  // another, each a little thicker as it comes nearer, in the same calm style as the Meseta.
  function drawPatchwork(L, xs, ys, uOff) {
    const P = L.patchwork;
    const bands = P.bands ?? 5;
    let top = 0;
    for (let b = 0; b < bands; b++) {
      const thick = H * 0.007 * (1 + b * 0.6);
      const crop = Math.floor(hash(b, L.seed + 23) * P.colors.length);
      const pts = [];
      for (let i = 0; i < xs.length; i++) {
        const wave = (noise1((xs[i] / S + uOff) * 2.2 + b * 7, L.seed + 25) - 0.5) * thick * 0.5;
        pts.push(xs[i], ys[i] + top + (b === 0 ? 0.5 : wave));
      }
      const bottom = b === bands - 1 ? H + BELOW + 20 : null;
      for (let i = xs.length - 1; i >= 0; i--) {
        const wave = (noise1((xs[i] / S + uOff) * 2.2 + (b + 1) * 7, L.seed + 25) - 0.5) * thick * 0.5;
        pts.push(xs[i], bottom ?? ys[i] + top + thick + wave);
      }
      L.patches[crop].poly(pts).fill(0xffffff);
      top += thick;
    }
    // Hay bales lying on the stubble along the top of a harvested field.
    if (P.bales !== undefined) {
      const r = H * 0.006 * (1 - L.depth * 0.5);
      for (let i = 0; i < xs.length; i += 3) {
        const u = xs[i] / S + uOff;
        if (noise1(u / 0.3, L.seed + 27) < 0.62 || hash(i + Math.round(uOff * 40), L.seed + 29) > 0.35) continue;
        const by = ys[i] + r * (1.2 + 2 * hash(i, L.seed + 31));
        L.bales.circle(xs[i], by - r, r).fill(0xffffff);
        L.balesShade.circle(xs[i] - r * 0.25, by - r, r * 0.55).fill(0xffffff);
      }
    }
  }
  // Now and then a red tractor stands out in a field: big rear wheel, small front wheel, a bonnet with an
  // exhaust stack and an open cab frame. It sits a little below the top of the field, never on the skyline.
  function drawTractors(L, uOff, x1) {
    const C = L.tractors, t = H * 0.0045;
    eachSlot(C.spacing, uOff, x1, (k) => {
      if (hash(k, L.seed + 101) > C.chance) return;
      const dir = hash(k, L.seed + 102) > 0.5 ? 1 : -1;
      const sx = ((k + 0.2 + hash(k, L.seed + 103) * 0.6) * C.spacing - uOff) * S;
      const y = yAt(L, sx, uOff) + H * 0.012 * (1 + hash(k, L.seed + 104));
      const X = (x) => sx + x * t * dir;
      const box = (g, x0, x1b, y0, y1) => g.rect(Math.min(X(x0), X(x1b)), y - y1 * t, Math.abs(X(x1b) - X(x0)), (y1 - y0) * t).fill(0xffffff);
      box(L.tractor, -1.6, 0.4, 1.1, 2.1);
      box(L.tractor, 0.4, 2.6, 0.9, 1.8);
      box(L.tractorDark, -1.5, -1.3, 2.1, 3.6);
      box(L.tractorDark, 0.1, 0.3, 2.1, 3.6);
      box(L.tractor, -1.7, 0.5, 3.6, 3.85);
      box(L.tractorDark, 1.9, 2.1, 1.8, 2.8);
      L.tractorDark.circle(X(-1), y - t * 1.25, t * 1.25).fill(0xffffff).circle(X(2), y - t * 0.6, t * 0.6).fill(0xffffff);
      L.tractorHub.circle(X(-1), y - t * 1.25, t * 0.5).fill(0xffffff).circle(X(2), y - t * 0.6, t * 0.25).fill(0xffffff);
    });
  }
  // A farmstead at the edge of the fields: a red-brick barn with a dark roof and a small house.
  function drawFarms(L, uOff, x1) {
    const C = L.farms, s = H * 0.011;
    eachSlot(C.spacing, uOff, x1, (k) => {
      if (hash(k, L.seed + 81) > C.chance) return;
      const sx = ((k + 0.25 + hash(k, L.seed + 82) * 0.5) * C.spacing - uOff) * S, y = yAt(L, sx, uOff) + 1;
      L.church.rect(sx - s * 1.6, y - s * 1.5, s * 3.2, s * 1.5 + 1).fill(0xffffff);
      L.roofs.poly([sx - s * 1.8, y - s * 1.5, sx, y - s * 2.6, sx + s * 1.8, y - s * 1.5]).fill(0xffffff);
      L.win.rect(sx - s * 0.4, y - s * 1.1, s * 0.8, s * 1.1).fill(0xffffff);
      house(L, sx + s * 2.9, y, s, { w: 1.5, h: 1, roof: 0.6 });
    });
  }
  // Roadside shrine (kapliczka): a small wooden box with a pitched roof and a cross, on a post.
  function drawShrines(L, uOff, x1) {
    const C = L.shrines, s = H * 0.009;
    eachSlot(C.spacing, uOff, x1, (k) => {
      if (hash(k, L.seed + 91) > C.chance) return;
      const sx = ((k + 0.4) * C.spacing - uOff) * S, y = yAt(L, sx, uOff) + 2;
      L.wood.rect(sx - s * 0.18, y - s * 3, s * 0.36, s * 3 + 1).fill(0xffffff);
      L.wood.rect(sx - s * 0.7, y - s * 4.3, s * 1.4, s * 1.3).fill(0xffffff);
      L.wood.poly([sx - s * 0.95, y - s * 4.3, sx, y - s * 5.1, sx + s * 0.95, y - s * 4.3]).fill(0xffffff);
      L.wood.rect(sx - s * 0.07, y - s * 5.9, s * 0.14, s * 0.85).fill(0xffffff);
      L.wood.rect(sx - s * 0.3, y - s * 5.6, s * 0.6, s * 0.13).fill(0xffffff);
      L.storkDark.rect(sx - s * 0.4, y - s * 4.0, s * 0.8, s * 0.8).fill(0xffffff);
    });
  }
  // Hunting stand (ambona) at the edge of a field: a boarded cabin with a pitched roof and a dark shooting
  // slit, raised on four splayed poles with a cross brace, and a ladder leaning up to the door.
  function drawStands(L, uOff, x1) {
    const C = L.stands, u = H * 0.0055 * (C.scale ?? 1);
    eachSlot(C.spacing, uOff, x1, (k) => {
      if (hash(k, L.seed + 111) > C.chance) return;
      const dir = hash(k, L.seed + 112) > 0.5 ? 1 : -1;
      const sx = ((k + 0.2 + hash(k, L.seed + 113) * 0.6) * C.spacing - uOff) * S;
      const y = yAt(L, sx, uOff) + 1;
      const X = (x) => sx + x * u * dir;
      const line = Math.max(0.8, u * 0.16);
      const top = y - u * 3;
      L.wood.moveTo(X(-1.1), y).lineTo(X(-0.7), top).moveTo(X(1.1), y).lineTo(X(0.7), top)
        .moveTo(X(-0.95), y - u * 1.2).lineTo(X(0.9), y - u * 2.4).moveTo(X(0.95), y - u * 1.2).lineTo(X(-0.9), y - u * 2.4);
      L.wood.stroke({ width: line * 1.4, color: 0xffffff, cap: 'round' });
      // Ladder from the ground in front up to the cabin.
      L.woodLines.moveTo(X(1.9), y).lineTo(X(0.9), top).moveTo(X(2.3), y).lineTo(X(1.3), top);
      for (let r = 0.15; r < 1; r += 0.18) L.woodLines.moveTo(X(1.9 - r), y - u * 3 * r).lineTo(X(2.3 - r), y - u * 3 * r);
      L.woodLines.stroke({ width: line, color: 0xffffff, cap: 'round' });
      L.wood.rect(sx - u * 0.9, top - u * 1.5, u * 1.8, u * 1.6).fill(0xffffff);
      L.wood.poly([X(-1.15), top - u * 1.4, X(0), top - u * 2.2, X(1.15), top - u * 1.4]).fill(0xffffff);
      L.woodLines.rect(sx - u * 0.6, top - u * 1.15, u * 1.2, u * 0.35).fill(0xffffff);
    });
  }
  // White storks standing in a meadow, at a size that fits the trees around them: white body and S-shaped
  // neck, black flight feathers ending in ragged tips, a black tail, and long red legs bent at the knee
  // and a red beak. Some stand upright, some bend down to feed.
  function drawStorks(L, uOff, x1) {
    const C = L.storks, s = H * 0.0048;
    eachSlot(C.spacing, uOff, x1, (k) => {
      if (hash(k, L.seed + 61) > C.chance) return;
      const count = 1 + Math.floor(hash(k, L.seed + 63) * 2);
      for (let n = 0; n < count; n++) {
        const sx = ((k + 0.2 + hash(k * 5 + n, L.seed + 62) * 0.6) * C.spacing - uOff) * S;
        const y = yAt(L, sx, uOff) + H * 0.008 * (1 + hash(k * 7 + n, L.seed + 64));
        const dir = hash(k * 3 + n, L.seed + 65) > 0.5 ? 1 : -1;
        const feeding = hash(k * 11 + n, L.seed + 66) < 0.4;
        const P = (x, yy) => [sx + x * s * dir, y - yy * s];
        const poly = (g, pts) => g.poly(pts.flatMap(([x, yy]) => P(x, yy))).fill(0xffffff);
        const line = (g, pts, w) => {
          const [a, ...rest] = pts.map(([x, yy]) => P(x, yy));
          g.moveTo(a[0], a[1]);
          for (const q of rest) g.lineTo(q[0], q[1]);
          g.stroke({ width: Math.max(0.8, s * w), color: 0xffffff, cap: 'round', join: 'round' });
        };
        const smoothPoly = (g, pts) => g.poly(smoothLoop(pts, 4).flatMap(([x, yy]) => P(x, yy))).fill(0xffffff);
        // Long red legs, the knee bending backwards, one leg a little behind the other.
        line(L.storkRed, [[-0.5, 0], [-0.25, 1.7], [-0.45, 3.1]], 0.2);
        line(L.storkRed, [[0.45, 0], [0.75, 1.6], [0.35, 3.1]], 0.2);
        L.storkRed.ellipse(...P(-0.65, 0.05), s * 0.45, s * 0.12).fill(0xffffff);
        L.storkRed.ellipse(...P(0.6, 0.05), s * 0.45, s * 0.12).fill(0xffffff);
        // A smooth white body, fuller at the breast, then the black flight feathers folded over the back
        // and running out past the tail in ragged tips.
        smoothPoly(L.stork, [[-2.1, 3.7], [-1.2, 4.5], [0.4, 4.85], [1.6, 4.6], [2, 4], [1.5, 3.3], [0, 2.95], [-1.4, 3.15]]);
        smoothPoly(L.storkDark, [[-0.7, 4.55], [0.9, 4.6], [0.6, 4], [-0.4, 3.45], [-1.6, 3.25], [-2.4, 3.05], [-2.9, 3.25], [-2.3, 3.6], [-2.8, 3.75], [-2.2, 4.05], [-1.6, 4.35]]);
        line(L.stork, [[-0.4, 4.3], [0.6, 4.25]], 0.12);
        if (feeding) {
          // Neck stretched down to the grass, the bill probing it.
          line(L.stork, [[1.6, 4.3], [2.3, 3.7], [2.6, 2.7]], 0.48);
          L.stork.ellipse(...P(2.65, 2.45), s * 0.48, s * 0.4).fill(0xffffff);
          L.storkRed.poly([...P(2.85, 2.55), ...P(3.15, 0.55), ...P(2.6, 2.25)]).fill(0xffffff);
        } else {
          // A long neck in a gentle S, the head held high, the long red bill pointing forward and down.
          line(L.stork, [[1.6, 4.4], [1.95, 5.35], [1.65, 6.25], [1.95, 7.05]], 0.46);
          L.stork.ellipse(...P(2.05, 7.15), s * 0.5, s * 0.42).fill(0xffffff);
          L.storkDark.circle(...P(2.25, 7.25), s * 0.1).fill(0xffffff);
          L.storkRed.poly([...P(2.4, 7.3), ...P(4.25, 6.55), ...P(2.45, 6.95)]).fill(0xffffff);
        }
      }
    });
  }
  // Wooden jetties on the lake. Seen from the side, a jetty running straight out from the shore would rise
  // up the picture like a tower, so, like the sea groynes, it runs off to the right as it goes out. Seen a
  // little from above, its deck is a band whose width lies along the shore (level in the picture), planked
  // across, with a dark edge and piles under it: drawn with a vertical width it would read as a fence.
  // The slots are wider than any screen, so there is at most one jetty in view.
  function drawJetty(L, sx, k, uOff) {
    const piles = 4;
    const shore = yAt(L, sx, uOff);
    // Along the jetty, q runs from 0 on the shore to 1 at its far end; (x, y) is its left edge there.
    const run = H * 0.09, rise = H * 0.05;
    const at = (q) => {
      const f = 1 - 0.4 * q;
      return { x: sx + q * run, y: shore - q * rise + H * 0.002, f, w: H * 0.03 * f, side: H * 0.004 * f };
    };
    const a = at(0), b = at(1);
    for (let i = 0; i < piles; i++) {
      const p = at(0.25 + (0.75 * i) / (piles - 1));
      const pw = Math.max(1.4, H * 0.004 * p.f), drop = H * 0.011 * p.f;
      for (const x of [p.x + pw / 2, p.x + p.w - pw / 2]) L.jettyPosts.rect(x - pw / 2, p.y, pw, p.side + drop).fill(0xffffff);
    }
    // The left side of the deck, its planks' ends, faces the viewer as a dark strip.
    L.jettySeams.poly([a.x, a.y, b.x, b.y, b.x, b.y + b.side, a.x, a.y + a.side]).fill(0xffffff);
    L.jettyDeck.poly([a.x, a.y, a.x + a.w, a.y, b.x + b.w, b.y, b.x, b.y]).fill(0xffffff);
    // Gaps between the planks, which lie across the jetty, level with the shore.
    for (let i = 1; i < 16; i++) {
      const p = at(i / 16);
      L.jettySeams.moveTo(p.x, p.y).lineTo(p.x + p.w, p.y).stroke({ width: Math.max(0.6, H * 0.001 * p.f), color: 0xffffff });
    }
    // The angler's rowing boat, moored alongside the end of the jetty; shown only while he isn't out fishing.
    const boatLen = H * 0.065 * b.f, u = boatLen / 60, bx = b.x + b.w + boatLen * 0.6, by = b.y + b.side + H * 0.008 * b.f;
    const B = (pts) => pts.flatMap(([x, y]) => [bx + x * u, by + y * u]);
    L.jettyBoat.poly(B([[-30, -8], [30, -8], [24, 0], [-24, 0]])).fill(0xffffff);
    L.jettyBoatRim.poly(B([[-30, -9], [30, -9], [30, -7], [-30, -7]])).fill(0xffffff);
    L.jettyBoatRim.moveTo(b.x + b.w, b.y + b.side * 0.5).lineTo(bx - 28 * u, by - 8 * u).stroke({ width: Math.max(0.6, H * 0.0008), color: 0xffffff });
    // The shore is clear of trees where the jetty starts and along it, or they would hide it.
    L.jettySpans.push([sx - H * 0.02, bx + boatLen * 0.6]);
  }
  function drawJetties(L, uOff, x1) {
    const J = L.jetties;
    L.jettySpans = [];
    // One put in view from the developer panel stands alone.
    if (L.forcedJettyU !== undefined) { drawJetty(L, (L.forcedJettyU - uOff) * S, -1, uOff); return; }
    eachSlot(J.spacing, uOff, x1, k => {
      if (hash(k, L.seed + 71) > J.chance) return;
      drawJetty(L, ((k + 0.35 + hash(k, L.seed + 72) * 0.3) * J.spacing - uOff) * S, k, uOff);
    });
  }
  function eachSlot(spacing, uOff, x1, fn) {
    const k0 = Math.floor((uOff - 0.3) / spacing), k1 = Math.ceil((uOff + x1 / S + 0.3) / spacing);
    for (let k = k0; k <= k1; k++) fn(k);
  }
  function drawBeach(L, xs, ys, uOff, x1) {
    const wet = [];
    for (let i = 0; i < xs.length; i++) wet.push(xs[i], ys[i] - 0.5);
    for (let i = xs.length - 1; i >= 0; i--) wet.push(xs[i], ys[i] + H * (0.005 + 0.002 * noise1((xs[i] / S + uOff) * 9, L.seed + 7)));
    L.wet.poly(wet).fill(0xffffff);
    // Wooden groynes: a row of posts running from the beach out to sea, shrinking with distance.
    eachSlot(L.groynes.spacing, uOff, x1, k => {
      const sx = ((k + 0.5) * L.groynes.spacing - uOff) * S, y0 = yAt(L, sx, uOff);
      for (let i = 0; i < 8; i++) {
        const pw = H * 0.0032 * (1 - i * 0.07), ph = H * (0.011 - i * 0.0009) * (0.8 + 0.4 * hash(k * 9 + i, L.seed + 11));
        const px = sx + i * H * 0.0045, py = y0 - i * H * 0.0042;
        L.roofs.rect(px - pw / 2, py - ph, pw, ph + 1).fill(0xffffff);
      }
    });
    // Fishing boats pulled up on the sand.
    const B = L.boats;
    eachSlot(B.spacing, uOff, x1, k => {
      if (hash(k, L.seed + 13) > B.chance) return;
      const sx = ((k + 0.2 + hash(k, L.seed + 14) * 0.6) * B.spacing - uOff) * S, y = yAt(L, sx, uOff) + H * 0.006;
      const s = H * 0.012, f = hash(k, L.seed + 15) > 0.5 ? 1 : -1;
      L.walls.poly([sx - 2.4 * s * f, y - 1.3 * s, sx + 2.6 * s * f, y - 1.6 * s, sx + 1.8 * s * f, y, sx - 1.9 * s * f, y]).fill(0xffffff);
      L.planks.rect(sx - 2.2 * s, y - 1.15 * s, 4.6 * s, Math.max(0.8, s * 0.14)).fill(0xffffff);
      L.roofs.rect(sx - 0.1 * s, y - 4.4 * s, Math.max(1, s * 0.16), 3 * s).fill(0xffffff);
      L.roofs.poly([sx + 0.06 * s, y - 4.4 * s, sx + 1.1 * s * f, y - 4.1 * s, sx + 0.06 * s, y - 3.8 * s]).fill(0xffffff);
    });
  }
  // Dune fences: short rows of wooden stakes that hold the sand.
  function drawFence(L, uOff, x1) {
    const F = L.fence;
    eachSlot(F.spacing, uOff, x1, k => {
      if (hash(k, L.seed + 41) > 0.6) return;
      const u0 = (k + hash(k, L.seed + 42) * 0.3) * F.spacing, n = 10 + Math.floor(hash(k, L.seed + 43) * 14);
      for (let i = 0; i < n; i++) {
        const sx = (u0 + i * 0.006 - uOff) * S, y = yAt(L, sx, uOff) + H * 0.006;
        const ph = H * (0.008 + 0.004 * hash(k * 31 + i, L.seed + 44));
        L.roofs.rect(sx - 0.7, y - ph, Math.max(1.2, H * 0.0016), ph).fill(0xffffff);
      }
    });
  }
  function drawTufts(L, uOff, x1) {
    eachSlot(0.005, uOff, x1, k => {
      if (hash(k, L.seed + 21) > 0.55) return;
      const sx = ((k + hash(k, L.seed + 22)) * 0.005 - uOff) * S, y = yAt(L, sx, uOff) + 1;
      const h = H * (0.006 + hash(k, L.seed + 23) * 0.012) * (L.depth < 0.3 ? 2.2 : 1);
      for (let b = -1; b <= 1; b++) L.tR.poly([sx + b * h * 0.12 - 0.8, y, sx + b * h * 0.12 + 0.8, y, sx + b * h * 0.45, y - h * (1 - Math.abs(b) * 0.25)]).fill(0xffffff);
    });
  }
  function drawLighthouses(L, uOff, x1) {
    const C = L.lighthouse;
    L.lights = [];
    eachSlot(C.spacing, uOff, x1, k => {
      if (hash(k, L.seed + 31) > C.chance) return;
      // One lighthouse per long stretch of coast, always in the middle of its slot, so two never stand side by side.
      const u = (k + 0.5) * C.spacing;
      const sx = (u - uOff) * S, y = yAt(L, sx, uOff) + 2;
      const th = H * (C.height || 0.1), wb = th * 0.15, wt = th * 0.1;
      L.lhRed.poly([sx - wb / 2, y, sx + wb / 2, y, sx + wt / 2, y - th, sx - wt / 2, y - th]).fill(0xffffff);
      for (const f of [0.28, 0.62]) {
        const w0 = lerp(wb, wt, f), w1 = lerp(wb, wt, f + 0.14);
        L.lhWhite.poly([sx - w0 / 2, y - th * f, sx + w0 / 2, y - th * f, sx + w1 / 2, y - th * (f + 0.14), sx - w1 / 2, y - th * (f + 0.14)]).fill(0xffffff);
      }
      // The head of a lighthouse, not a gable: a gallery deck wider than the tower with a railing round it,
      // the glazed lantern room with dark glazing bars, and a round metal dome with a small ball on top.
      const top = y - th, lh = th * 0.12, line = Math.max(1, wt * 0.07);
      const deckH = Math.max(1.5, th * 0.022), railH = lh * 0.42;
      L.roofs.rect(sx - wt * 0.85, top - deckH, wt * 1.7, deckH).fill(0xffffff);
      L.roofs.rect(sx - wt * 0.82, top - deckH - railH, wt * 1.64, line).fill(0xffffff);
      for (const f of [-0.8, -0.4, 0.4, 0.8]) L.roofs.rect(sx + wt * f - line / 2, top - deckH - railH, line, railH).fill(0xffffff);
      const lw = wt * 0.34, roomH = lh * 0.95, roomTop = top - deckH - roomH;
      L.win.rect(sx - lw, roomTop, lw * 2, roomH).fill(0xffffff);
      for (const f of [-1, 0, 1]) L.roofs.rect(sx + lw * f - line / 2, roomTop, line, roomH).fill(0xffffff);
      const dome = [];
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI * (i / 12);
        dome.push(sx - Math.cos(a) * lw * 1.2, roomTop - Math.sin(a) * lh * 0.5);
      }
      L.roofs.poly(dome).fill(0xffffff);
      L.roofs.rect(sx - line / 2, roomTop - lh * 0.75, line, lh * 0.3).fill(0xffffff);
      L.roofs.circle(sx, roomTop - lh * 0.78, line * 0.9).fill(0xffffff);
      L.lights.push({ u, lampDy: th + deckH + roomH * 0.5 });
    });
  }
  // Lakeside foreground: where the near ground rises into view it is a bush, a cluster of round leafy
  // masses, with a bed of reeds at its feet, the tallest stems topped by bulrush heads. All one dark
  // silhouette like the rest of the foreground; every choice comes from the ground position, so the
  // same stretch of shore always grows the same way.
  function drawShoreGrowth(L, xs, ys, uOff) {
    const g = L.g, floor = H + 6;
    for (let i = 2; i < xs.length - 2; i++) {
      const rise = floor - ys[i];
      if (rise < H * 0.01) continue;
      const u = xs[i] / S + uOff, k = Math.floor(u * 900);
      // The bush crowns the highest part of each rise.
      if (ys[i] <= ys[i - 1] && ys[i] <= ys[i + 1]) {
        const r = rise * 0.4;
        for (let b = 0; b < 5; b++) {
          const ox = (hash(k + b, L.seed + 61) - 0.5) * r * 2.2, oy = hash(k + b, L.seed + 62) * r * 0.6;
          g.circle(xs[i] + ox, ys[i] - r * 0.35 + oy, r * (0.5 + 0.35 * hash(k + b, L.seed + 63))).fill(0xffffff);
        }
      }
      // Reeds: a few stems here and there along the rise, leaning a little, taller where the ground is higher.
      // Sparse: a clump on roughly every third step, of one to three stems.
      if (i % 2 || hash(k, L.seed + 64) > 0.6) continue;
      const stems = 1 + Math.floor(hash(k, L.seed + 65) * 2);
      for (let r = 0; r < stems; r++) {
        const x = xs[i] + (hash(k * 5 + r, L.seed + 66) - 0.5) * (xs[1] - xs[0]) * 2;
        const tall = (rise * 1.2 + H * 0.04) * (0.6 + 0.6 * hash(k * 5 + r, L.seed + 67));
        const lean = (hash(k * 5 + r, L.seed + 68) - 0.5) * tall * 0.25;
        const top = [x + lean, ys[i] - tall];
        g.moveTo(x, ys[i] + 2).quadraticCurveTo(x + lean * 0.2, ys[i] - tall * 0.5, top[0], top[1])
          .stroke({ width: Math.max(1, H * 0.0022), color: 0xffffff, cap: 'round' });
        // Every stem carries its bulrush head just below the tip, the thin spike above it; bare stems read
        // as sticks, the leaves alone already give the clump its body.
        g.ellipse(x + lean * 0.9, ys[i] - tall * 0.86, H * 0.0035, H * 0.012).fill(0xffffff);
      }
      // Between the stems, long flat leaves: narrow blades that rise from the base and arch outwards,
      // lower than the stems, some bending right over.
      const leaves = 2 + Math.floor(hash(k, L.seed + 70) * 3);
      for (let f = 0; f < leaves; f++) {
        const h0 = hash(k * 7 + f, L.seed + 71), h1 = hash(k * 7 + f, L.seed + 72);
        const x = xs[i] + (h0 - 0.5) * (xs[1] - xs[0]) * 2.4;
        const len = (rise * 0.9 + H * 0.03) * (0.5 + 0.5 * h1);
        const side = h0 < 0.5 ? -1 : 1, arch = side * len * (0.15 + 0.35 * hash(k * 7 + f, L.seed + 73));
        const base = Math.max(1.2, H * 0.0035), left = [], right = [];
        for (let q = 0; q <= 8; q++) {
          const t = q / 8;
          // Up and out along a curve that leans further the higher it goes, tapering to a point.
          const cx = x + arch * t * t, cy = ys[i] + 2 - len * t * (1 - 0.25 * t * Math.abs(arch) / len);
          const w = base * (1 - t);
          left.push(cx - w, cy); right.unshift(cx + w, cy);
        }
        g.poly([...left, ...right]).fill(0xffffff);
      }
    }
  }

  function rebuildLayer(L, uOff) {
    L.u0 = uOff;
    const step = Math.max(3, W / 300);
    const x1 = W + MARGIN + step;
    const xs = [], ys = [];
    for (let x = -step * 2; x <= x1; x += step) { xs.push(x); ys.push(yAt(L, x, uOff)); }
    for (const g of L.graphics) g.clear();
    if (L.shopTexts) { L.shopTexts.removeChildren().forEach((text) => text.destroy()); L.shops = []; }
    const pts = [xs[0], H + BELOW + 20];
    for (let i = 0; i < xs.length; i++) pts.push(xs[i], ys[i]);
    pts.push(xs[xs.length - 1], H + BELOW + 20);
    L.g.poly(pts).fill(0xffffff);
    const side = L.faces ? drawFaces(L, xs, ys) : null;
    if (L.snow) drawSnow(L, xs, ys, uOff, side);
    if (L.path) drawPath(L, xs, ys, uOff, x1);
    if (L.rows) drawRows(L, xs, ys, uOff);
    if (L.jetties) drawJetties(L, uOff, x1);
    if (L.trees) drawTrees(L, uOff, x1);
    if (L.cabins) drawCabins(L, uOff, x1);
    if (L.patchwork) drawPatchwork(L, xs, ys, uOff);
    if (L.village) drawVillage(L, uOff, x1);
    if (L.stands) drawStands(L, uOff, x1);
    if (L.storks) drawStorks(L, uOff, x1);
    if (L.farms) drawFarms(L, uOff, x1);
    if (L.tractors) drawTractors(L, uOff, x1);
    if (L.shrines) drawShrines(L, uOff, x1);
    if (L.reeds) drawShoreGrowth(L, xs, ys, uOff);
    if (L.beach) drawBeach(L, xs, ys, uOff, x1);
    if (L.tufts) drawTufts(L, uOff, x1);
    if (L.lighthouse) drawLighthouses(L, uOff, x1);
    if (L.fence) drawFence(L, uOff, x1);
    if (L.rimG) {
      L.rimG.moveTo(xs[0], ys[0]);
      for (let i = 1; i < xs.length; i++) L.rimG.lineTo(xs[i], ys[i]);
      L.rimG.stroke({ width: 1.2, color: 0xffffff });
    }
    if (L.rg) {
      const Ly = env.lakeY;
      const rp = [xs[0], Ly];
      for (let i = 0; i < xs.length; i++) rp.push(xs[i], 2 * Ly - ys[i]);
      rp.push(xs[xs.length - 1], Ly);
      L.rg.clear().poly(rp).fill(0xffffff);
    }
  }
  // Layers are drawn once over a strip wider than the screen and slid sideways;
  // they are only re-tessellated after scrolling past the extra margin.
  function placeLayer(L) {
    const uOff = layerOffset(L);
    let shift = (uOff - L.u0) * S;
    if (shift > MARGIN || shift < 0) { rebuildLayer(L, uOff); shift = 0; }
    L.c.x = -shift;
    if (L.rg) L.rg.x = -shift;
  }

  function makeLayer(spec, i) {
    const L = { ...spec, seed: state.seed * 977 + i * 131 + 11, shift: hash(i, state.seed) * 60, u0: -1e9, graphics: [] };
    if (L.lighthouse && L.lighthouse.first !== undefined) L.shift = L.lighthouse.spacing * 0.5 - L.lighthouse.first * W / S - state.offsetU * L.speed;
    L.c = new Container();
    const add = () => { const g = new Graphics(); L.c.addChild(g); L.graphics.push(g); return g; };
    L.g = add();
    // The jetty starts on the shore and runs out over the water, in front of the land and behind its trees.
    if (L.jetties) { L.jettyBoat = add(); L.jettyBoatRim = add(); L.jettyPosts = add(); L.jettyDeck = add(); L.jettySeams = add(); L.jettySpans = []; }
    if (L.faces) { L.shL = add(); L.shR = add(); L.gully = add(); }
    if (L.snow) { L.sgL = add(); L.sgR = add(); }
    if (L.path) { L.pathG = add(); L.gully = add(); }
    if (L.patchwork) { L.patches = L.patchwork.colors.map(() => add()); L.bales = add(); L.balesShade = add(); }
    if (L.rows) L.rowG = add();
    if (L.trees || L.cabins || L.village || L.tufts) { L.tL = add(); L.tR = add(); }
    if (L.trees?.birch || L.trees?.type === 'coastpine') { L.bark = add(); L.barkMarks = add(); }
    if (L.beach) L.wet = add();
    if (L.lighthouse) { L.lhRed = add(); L.lhWhite = add(); }
    if (L.cabins || L.village || L.boats || L.lighthouse || L.fence || L.farms) { L.walls = add(); L.planks = add(); L.church = add(); L.roofs = add(); L.win = add(); }
    if (L.village?.shops) {
      // The shop sign: its green panel, a soft halo that brightens with the dusk, and the lettering.
      L.neonGlow = add(); L.neonGlow.blendMode = 'add'; L.neon = add();
      L.shopTexts = new Container(); L.c.addChild(L.shopTexts); L.shops = [];
    }
    if (L.tractors) { L.tractor = add(); L.tractorDark = add(); L.tractorHub = add(); }
    if (L.stands || L.storks || L.shrines) { L.wood = add(); L.woodLines = add(); L.stork = add(); L.storkDark = add(); L.storkRed = add(); }
    if (L.rim) { L.rimG = add(); L.rimG.blendMode = 'add'; }
    return L;
  }

  function buildLake() {
    const c = new Container();
    const mask = new Graphics(); c.addChild(mask); c.mask = mask;
    const skyR = new Sprite(skyTex); c.addChild(skyR);
    const refl = new Container(); refl.alpha = 0.85; c.addChild(refl);
    const sheen = new Sprite(sheenTex); c.addChild(sheen);
    const streak = addSprite(c, glowTex, { add: true });
    const body = new Sprite(fogTex); c.addChild(body);
    const shimmer = new Graphics(); c.addChild(shimmer);
    const shore = new Graphics(); c.addChild(shore);
    return { c, mask, skyR, refl, sheen, streak, body, shimmer, shore };
  }

  function buildMist(yFrac, idx) {
    const c = new Container();
    const items = [];
    for (let i = 0; i < 5; i++) {
      const r = k => hash(i * 7 + k, state.seed + idx * 31 + 500);
      items.push({ s: addSprite(c, blobTex), base: r(0), y: yFrac + (r(1) - 0.5) * 0.05, w: 0.35 + r(2) * 0.4, h: 0.03 + r(3) * 0.035, a: 0.5 + r(4) * 0.5, speed: 2 + r(5) * 5 });
    }
    return { c, items };
  }

  const rays = [];
  function buildEnvironment() {
    for (const c of [landscape, front]) c.removeChildren().forEach(ch => ch.destroy({ children: true }));
    // The lighthouse glare lives in the veil layer, which is not rebuilt; remove it with the old biome.
    if (env && env.glare) { env.glare.destroy(); env.flash.destroy(); }
    rays.length = 0;
    const def = biomeAt(state.biome, state.level);
    env = { def, layers: [], lake: def.lake ? buildLake() : null, lakeY: 0, ground: null, overlay: null, mists: [] };
    def.layers.forEach((spec, i) => {
      if (spec === 'lake') {
        landscape.addChild(env.lake.c);
        // Outside the sea's mask, because a ship's superstructure rises above the horizon line.
        if (def.vessels) {
          env.ships = Object.fromEntries(def.vessels.map((kind) => [kind, new Graphics()]));
          landscape.addChild(...Object.values(env.ships));
        }
      }
      else {
        const L = makeLayer(spec, i);
        landscape.addChild(L.c);
        // Drawn right after its ridge: in front of that ridge's trees, behind every nearer layer.
        if (L.bigfoot) { env.bigfoot = { g: new Graphics(), L }; landscape.addChild(env.bigfoot.g); }
        if (L.fog) { L.fogS = new Sprite(fogTex); landscape.addChild(L.fogS); }
        if (L.reflect && env.lake) { L.rg = new Graphics(); env.lake.refl.addChild(L.rg); }
        if (L.kind === 'ground') env.ground = L;
        if (L.beach) { env.beach = L; env.foam = new Graphics(); landscape.addChild(env.foam); }
        if (L.lighthouse) {
          env.lightL = L;
          env.beam = addSprite(landscape, beamTex, { add: true, tint: 0xfff1c8 }); env.beam.anchor.set(0, 0.5);
          env.glare = addSprite(veilC, glowTex, { add: true, tint: 0xfff4d6 });
          env.flash = addSprite(veilC, glowTex, { add: true, tint: 0xfff1c8 });
        }
        env.layers.push(L);
      }
      if (def.mistAfter.includes(i)) {
        const m = buildMist(spec === 'lake' ? def.lake + 0.015 : spec.base - spec.amp * 0.15, i);
        landscape.addChild(m.c); env.mists.push(m);
      }
    });
    for (let i = 0; i < 6; i++) {
      rays.push({ s: addSprite(landscape, rayTex, { add: true }), a: (i - 2.5) * 0.13 + (hash(i, state.seed) - 0.5) * 0.08, w: 0.05 + hash(i, state.seed + 1) * 0.1, k: 0.6 + hash(i, state.seed + 2) * 0.6 });
      rays[i].s.anchor.set(0, 0.5);
    }
    if (def.overlay) {
      env.overlay = makeLayer(def.overlay, 99); front.addChild(env.overlay.c);
      // The foreground rocks and ferns must never hide the wanderer, the cat or the camp: a soft window
      // over them makes the foreground nearly see-through there (see `layoutEnvironment`).
      env.overlayWindow = new Sprite(Texture.WHITE); front.addChild(env.overlayWindow);
      env.overlay.c.mask = env.overlayWindow;
    }
    buildClouds(def);
    layoutEnvironment();
  }

  // Fully drawn foreground everywhere, except a soft ellipse rising from the bottom edge over the wanderer,
  // from the tent behind him to the cat's place past the fire, where only a trace of it is left.
  const OVERLAY_TRACE = 0.18;
  function drawOverlayWindow() {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(W)); c.height = Math.max(1, Math.round(H + BELOW));
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    const tx = W * (W > H ? 0.44 : 0.6);
    const cx = tx - 10 * unit, rx = 260 * unit, ry = 230 * unit;
    x.save();
    x.translate(cx, H); x.scale(rx / ry, 1);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, ry);
    g.addColorStop(0, `rgba(0,0,0,${1 - OVERLAY_TRACE})`);
    g.addColorStop(0.7, `rgba(0,0,0,${1 - OVERLAY_TRACE})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalCompositeOperation = 'destination-out';
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, ry, 0, Math.PI * 2); x.fill();
    x.restore();
    const old = env.overlayWindow.texture;
    env.overlayWindow.texture = Texture.from(c);
    if (old !== Texture.WHITE) old.destroy(true);
    env.overlayWindow.width = W; env.overlayWindow.height = H + BELOW;
  }

  function layoutEnvironment() {
    if (!env) return;
    env.lakeY = env.def.lake ? env.def.lake * H : 0;
    for (const L of env.layers) {
      L.u0 = -1e9;
      if (L.fogS) {
        const y0 = (L.base - L.amp * 0.45) * H;
        L.fogS.position.set(0, y0); L.fogS.width = W; L.fogS.height = H - y0 + 10;
      }
    }
    if (env.overlay) { env.overlay.u0 = -1e9; drawOverlayWindow(); }
    const lk = env.lake;
    if (lk) {
      const Ly = env.lakeY;
      lk.mask.clear().rect(0, Ly, W, H - Ly).fill(0xffffff);
      lk.skyR.width = W; lk.skyR.height = H; lk.skyR.scale.y = -Math.abs(lk.skyR.scale.y); lk.skyR.y = 2 * Ly;
      lk.sheen.position.set(0, Ly); lk.sheen.width = W; lk.sheen.height = H * 0.07;
      lk.body.position.set(0, Ly); lk.body.width = W; lk.body.height = H * 0.2;
      lk.shore.clear().rect(0, Ly, W, Math.max(1, H * 0.0015)).fill(0xffffff);
    }
  }

  // ---------- ships ----------
  // Now and then a vessel crosses the open sea: a container ship far out on the horizon, slow, or a
  // fishing cutter nearer the shore, quicker and rocking on the swell. Each kind has its own slots on the
  // animation clock; a slot brings one crossing or none, so they come rarely and never pile up.
  // `y` is the waterline below the horizon and `len` the length, both in screen heights; `cross` is the
  // seconds a crossing takes, so the pace is the same on every screen width. The animation clock restarts
  // with every page load, so the first slot always brings a vessel, `start` seconds in: otherwise a
  // player could open the game several times and never see the sea in use.
  // Whether a Ropucha shop has been reported in view; once is enough.
  let ropuchaReported = false;
  // How far the weather lets fair-weather boats out, eased so a change of weather fades them in or out.
  let fairK = 1;
  const SHIPS = {
    cargo: { id: 'ship', slot: 150, cross: 110, chance: 0.7, start: 40, y: 0.005, len: 0.17, depth: 0.92, seed: 611 },
    // A rowing boat at anchor while its angler fishes: it fades in at a spot on the lake and stays there for
    // the visit (`cross` seconds), so as the wanderer walks on it slides past with the lake like the rest
    // of the landscape and leaves the screen. Only out in daylight.
    // He stays ashore in snow or a storm; rain and wind don't put him off.
    angler: { id: 'angler', slot: 130, cross: 120, chance: 0.6, start: 20, y: 0.032, len: 0.05, depth: 0.55, seed: 614, daytime: true, anchored: true, fairWeather: true },
    cutter: { id: 'fishingBoat', slot: 70, cross: 45, chance: 0.65, start: 4, y: 0.045, len: 0.1, depth: 0.72, seed: 612 },
    // Lake district: a dinghy crossing under sail (only with some wind) and a pair of swans gliding by,
    // in the same scale as the angler's boat (`len` is that of the lane, not of the craft).
    sailboat: { id: 'sailboat', slot: 150, cross: 130, chance: 0.6, start: 70, y: 0.02, len: 0.05, depth: 0.6, seed: 618, daytime: true, windy: true },
    swans: { id: 'swans', slot: 110, cross: 170, chance: 0.6, start: 35, y: 0.05, len: 0.05, depth: 0.5, seed: 619, daytime: true },
  };
  // How fast the lake surface moves past as the wanderer walks: between the far shore (0.07) and the near
  // wooded bank (0.25), as far away as a boat on it looks.
  const LAKE_SPEED = 0.15;
  // Where each anchored vessel lies for its current visit, in lake units.
  const anchors = {};
  // Where a vessel is now: progress 0..1 across the screen and its heading, or null when the sea is empty.
  function shipPass(kind, t, forcedAgeS) {
    const sh = SHIPS[kind];
    if (forcedAgeS < sh.cross) return { k: forcedAgeS / sh.cross, dir: 1 };
    const slot = Math.floor((t - sh.start) / sh.slot), k = (t - sh.start - slot * sh.slot) / sh.cross;
    if (slot < 0 || k >= 1 || (slot > 0 && hash(slot, sh.seed) > sh.chance)) return null;
    // A crossing that began during a called-up one is skipped, or it would appear mid-sea when that ends.
    if (t - forcedAgeS + sh.cross > sh.start + slot * sh.slot) return null;
    return { k, dir: hash(slot, sh.seed + 1) < 0.5 ? 1 : -1 };
  }
  // Drawn facing +x in its own units: 100 to the vessel's length, waterline at 0, up is negative.
  // `col` hazes a colour by distance; lights are left untinted so they glow at night.
  function drawCargoShip(g, col, nightK) {
    g.clear();
    g.poly([-50, -9, 47, -10, 50, -9, 44, 0, -46, 0]).fill(col(0x7a2f2a));
    g.rect(-50, -10, 97, 2.2).fill(col(0x2c2b30));
    const boxes = [0x3b6e8f, 0xb5523b, 0xd9a441, 0x5f7f4f, 0x8a8f96];
    for (let i = 0; i < 9; i++) {
      for (let row = 0; row < 2; row++) {
        if (row === 1 && (i === 0 || i === 8 || i % 4 === 2)) continue;
        g.rect(-24 + i * 7.2, -16 - row * 6, 6.8, 6).fill(col(boxes[(i * 3 + row * 2) % boxes.length]));
      }
    }
    g.rect(-46, -27, 16, 17).fill(col(0xe9e6df));
    g.rect(-48, -29, 20, 2.5).fill(col(0xe9e6df));
    g.rect(-44, -24, 12, 2).fill(col(0x3a4652));
    g.rect(-41, -36, 5, 8).fill(col(0x2c2b30));
    if (nightK > 0.05) {
      g.circle(-38, -38, 1.6).fill({ color: 0xfff4d0, alpha: nightK });
      g.circle(44, -12, 1.4).fill({ color: 0xfff4d0, alpha: nightK });
      g.rect(-44, -24, 12, 2).fill({ color: 0xffd58a, alpha: nightK * 0.8 });
    }
  }
  function drawCutter(g, col, nightK, t) {
    g.clear();
    // The wake trails astern on the water, broken and fading.
    for (let i = 0; i < 4; i++) {
      const x0 = -52 - i * 16, wob = Math.sin(t * 2 + i) * 1.2;
      g.moveTo(x0, 0.5 + wob * 0.3).lineTo(x0 - 12, 0.8 + i * 0.6).stroke({ width: 1.6, color: 0xffffff, alpha: 0.4 * (1 - i / 4) });
    }
    g.poly([-48, -10, 40, -12, 50, -19, 42, 0, -44, 0]).fill(col(0x2f4f6e));
    g.rect(-46, -8, 90, 2.4).fill(col(0xe8e4da));
    g.poly([-48, -10, 40, -12, 41, -10, -48, -8]).fill(col(0xb5403a));
    g.rect(-14, -32, 26, 21).fill(col(0xece8de));
    g.rect(-16, -34, 30, 3).fill(col(0xb5403a));
    g.rect(-10, -28, 18, 6).fill(col(0x34414d));
    // Mast with a derrick boom, and the stern gantry the nets are hauled over.
    g.moveTo(22, -12).lineTo(22, -62).stroke({ width: 2.4, color: col(0x3a3a3e) });
    g.moveTo(22, -50).lineTo(-6, -36).stroke({ width: 1.6, color: col(0x3a3a3e) });
    g.moveTo(22, -62).lineTo(47, -18).stroke({ width: 0.8, color: col(0x3a3a3e) });
    g.moveTo(-40, -10).lineTo(-36, -38).lineTo(-28, -38).lineTo(-26, -10).stroke({ width: 2, color: col(0x3a3a3e) });
    g.poly([22, -62, 22, -55, 31, -58]).fill(col(0xd9a441));
    if (nightK > 0.05) {
      g.circle(22, -60, 2).fill({ color: 0xfff4d0, alpha: nightK });
      g.circle(-6, -30, 1.4).fill({ color: 0x5ee08a, alpha: nightK });
      g.rect(-10, -28, 18, 6).fill({ color: 0xffd58a, alpha: nightK * 0.8 });
    }
  }

  // Now and then a fish bites: over five seconds of a 28-second cast the rod dips, rises bent, the fish
  // comes up wriggling on the line and is swung into the boat; then he casts again.
  const CATCH = { cast: 28, length: 5, chance: 0.5, seed: 617, pike: 0.1 };
  // The cast whose pike was last reported, so each catch is reported once.
  let pikeReported = null;
  // The angler's rowing boat: in vessel units (100 to the length of the lane, waterline at 0), the hull 60
  // long, about 4.5 m. `at` places a point of it in the drawing.
  function rowboat(g, col, at) {
    const P = (pts) => pts.flatMap(([x, y]) => at(x, y));
    g.poly(P([[-30, -8], [30, -8], [24, 0], [-24, 0]])).fill(col(0x7a5236));
    g.poly(P([[-30, -9], [30, -9], [30, -7], [-30, -7]])).fill(col(0x5a3a25));
    g.poly(P([[-4, -9], [4, -9], [4, -7.5], [-4, -7.5]])).fill(col(0x4a3020));
  }
  // A small sailing dinghy (an Omega, about 6 m, mast about 8 m) in the same units: white sails heeled a
  // little by the wind, which also sets how far the boom swings out.
  function drawSailboat(g, col, t, windK) {
    g.clear();
    const heel = Math.min(0.12, 0.04 * windK) + Math.sin(t * 0.9) * 0.01;
    const R = (x, y) => [x * Math.cos(heel) - y * Math.sin(heel), x * Math.sin(heel) + y * Math.cos(heel)];
    const P = (pts) => pts.flatMap(([x, y]) => R(x, y));
    g.poly(P([[-41, -9], [41, -10], [34, 0], [-36, 0]])).fill(col(0xf1ede4));
    g.poly(P([[-41, -9], [41, -10], [41, -8], [-41, -7]])).fill(col(0x3c5f8a));
    g.poly(P([[-2, -10], [0, -115], [1.6, -115], [0.4, -10]])).fill(col(0x8a8378));
    // Mainsail between mast and boom, jib in front of the mast.
    g.poly(P([[0, -112], [-2, -16], [-36, -14]])).fill(col(0xfbf8f0));
    g.poly(P([[2, -104], [3, -15], [34, -12]])).fill(col(0xece7dc));
    g.poly(P([[-2, -16], [-36, -14], [-36, -12.5], [-2, -14.5]])).fill(col(0x8a8378));
    // Two crew in the cockpit, leaning out a little.
    g.circle(...R(-18, -16), 3.2).fill(col(0xd8b08c));
    g.circle(...R(-26, -15), 3).fill(col(0xd8b08c));
    g.poly(P([[-22, -13], [-14, -13], [-15, -9], [-21, -9]])).fill(col(0xb8452f));
  }
  // A pair of mute swans gliding, in the same units (one about 1.3 m long): white bodies, necks in the
  // gentle S they hold on the water, orange bills. The second follows a length behind.
  function drawSwans(g, col, t) {
    g.clear();
    for (const [dx, s, ph] of [[0, 1, 0], [-26, 0.94, 1.7]]) {
      const bob = Math.sin(t * 0.8 + ph) * 0.4, X = (x) => dx + x * s, Y = (y) => y * s + bob;
      g.ellipse(X(0), Y(-3), 9 * s, 3.6 * s).fill(col(0xf6f3ec));
      g.poly([X(-9), Y(-3), X(-14), Y(-6.5), X(-6), Y(-5)]).fill(col(0xece7de));
      g.moveTo(X(6), Y(-4)).bezierCurveTo(X(11), Y(-6), X(5), Y(-13), X(8.5), Y(-17)).stroke({ width: 2.2 * s, color: col(0xf6f3ec), cap: 'round' });
      g.circle(X(9.3), Y(-17.4), 1.7 * s).fill(col(0xf6f3ec));
      g.poly([X(10.4), Y(-18), X(13.4), Y(-16.8), X(10.6), Y(-16.4)]).fill(col(0xe07a2c));
      g.circle(X(9.6), Y(-18), 0.45 * s).fill(col(0x1d1b1a));
      // A faint wake behind each.
      g.moveTo(X(-10), Y(0.4)).lineTo(X(-22), Y(1.2)).stroke({ width: 0.8, color: 0xffffff, alpha: 0.35 });
    }
  }
  // `shownFor`: seconds since the developer panel called him up, or Infinity; then he lands a pike at once,
  // so the rare catch can be seen on demand.
  function drawAngler(g, col, t, shownFor) {
    g.clear();
    const forced = shownFor < Infinity;
    const onDemand = forced && shownFor > 2 && shownFor < 2 + CATCH.length;
    const cast = onDemand ? -1 : Math.floor(t / CATCH.cast), c = onDemand ? shownFor - 2 : mod(t, CATCH.cast);
    const catching = onDemand || (hash(cast, CATCH.seed) < CATCH.chance && c < CATCH.length);
    // Now and then the fish on the line is a pike: long, olive and spotted, fighting and bending the rod.
    const pike = catching && (onDemand || hash(cast, CATCH.seed + 1) < CATCH.pike);
    const water = [58, 0];
    // The rod tip: resting with a small twitch now and then, dipping at the bite, raised and bent while
    // the fish comes up.
    const twitch = Math.sin(t * 0.9) > 0.92 ? Math.sin(t * 25) * 2 : 0;
    let tip = [52, -40 + twitch];
    let fish = null;
    if (catching) {
      if (c < 1) tip = [53, -34 + Math.sin(c * 30) * 1.5];
      else if (c < 3) { tip = [44, -50]; const k = smooth(1, 3, c); fish = [lerp(water[0], 46, k), lerp(water[1], -36, k)]; }
      else if (c < 4) { tip = [lerp(44, 20, c - 3), -50]; const k = smooth(3, 4, c); fish = [lerp(46, 0, k), lerp(-36, -14, k)]; }
      else tip = [lerp(20, 52, smooth(4, 5, c)), lerp(-50, -40, smooth(4, 5, c))];
    }
    // Rings spreading where the line meets the water; a splash ring when the fish leaves it.
    const splash = catching && c > 1 && c < 2.2;
    for (let i = 0; i < 2; i++) {
      const k = mod(t * (splash ? 1.2 : 0.35) + i * 0.5, 1);
      g.ellipse(water[0], 0.5, 4 + k * 16, 1 + k * 3).stroke({ width: 1, color: 0xffffff, alpha: (splash ? 0.7 : 0.45) * (1 - k) });
    }
    rowboat(g, col, (x, y) => [x, y]);
    // The angler sits in the stern, rod held up and out over the water.
    g.roundRect(-14, -25, 12, 17, 4).fill(col(0x3f5a4a));
    g.circle(-8, -29, 4.2).fill(col(0xd8b08c));
    g.ellipse(-8, -32.5, 7, 1.6).fill(col(0x4a3a2a));
    g.roundRect(-11.5, -37, 7, 5, 2).fill(col(0x4a3a2a));
    const bend = fish ? (pike ? -14 + Math.sin(t * 9) * 3 : -8) : 0;
    g.moveTo(-4, -18).quadraticCurveTo(24, -46 + bend, tip[0], tip[1]).stroke({ width: 1.4, color: col(0x3a3028) });
    const end = fish ?? (catching && c >= 4 ? null : water);
    if (end) g.moveTo(tip[0], tip[1]).quadraticCurveTo(lerp(tip[0], end[0], 0.5) + 4, lerp(tip[1], end[1], 0.6), end[0], end[1]).stroke({ width: 0.6, color: col(0xe8e4da), alpha: 0.8 });
    if (fish && pike) {
      // A pike hanging from the line, head up and duck-bill snout open, thrashing: a long olive body with
      // pale spots and a cream belly, red fins near the tail.
      const w = Math.sin(t * 16) * 2.2;
      const P = (x, y) => [fish[0] + x + (y / 22) * w, fish[1] + y];
      const body = [[-2.6, 3], [-3, 8], [-2.8, 14], [-1.6, 19], [0, 20], [1.6, 19], [2.8, 14], [3, 8], [2.6, 3], [1.4, 0.5], [0, -0.4], [-1.4, 0.5]];
      g.poly(body.flatMap(([x, y]) => P(x, y))).fill(col(0x7d8a3e));
      g.poly([[0.6, 2], [2.6, 3], [3, 8], [2.8, 14], [1.6, 19], [0.8, 19.4], [1.6, 12], [1.4, 6]].flatMap(([x, y]) => P(x, y))).fill(col(0xe8dcb8));
      for (const [x, y] of [[-1.2, 6], [0.2, 9], [-1.4, 12], [0, 15]]) g.ellipse(...P(x, y), 0.8, 0.45).fill(col(0xe6df9a));
      g.poly([[-1, 19.5], [-3.6, 23], [0, 21.4], [3.6, 23], [1, 19.5]].flatMap(([x, y]) => P(x, y))).fill(col(0xb5563a));
      g.poly([[-2.8, 15], [-4.4, 17.5], [-2.2, 17.2]].flatMap(([x, y]) => P(x, y))).fill(col(0xb5563a));
      g.circle(...P(-0.9, 2.2), 0.55).fill(col(0x1d1b1a));
      // Splash drops flung off it.
      for (let i = 0; i < 4; i++) {
        const a = t * 7 + i * 1.6, r = 4 + mod(t * 3 + i, 1) * 6;
        g.circle(fish[0] + Math.cos(a) * r, fish[1] + 10 + Math.sin(a) * r * 0.6, 0.6).fill({ color: 0xffffff, alpha: 0.6 });
      }
      const catchKey = onDemand ? `forced${Math.floor(t - shownFor)}` : cast;
      if (pikeReported !== catchKey && c > 1.4 && c < 3) {
        pikeReported = catchKey;
        options.onWorldEvent?.({ id: 'pikeCaught', forced });
      }
    } else if (fish) {
      // A silver fish hanging from the line, head down, wriggling.
      const w = Math.sin(t * 22) * 0.5;
      g.ellipse(fish[0], fish[1] + 5, 2.2, 5).fill(col(0xc9d2d6));
      g.poly([fish[0], fish[1] + 9, fish[0] - 3 + w * 2, fish[1] + 13, fish[0] + 3 + w * 2, fish[1] + 13]).fill(col(0xa9b4ba));
    }
    g.moveTo(-6, -18).lineTo(-2, -18).stroke({ width: 3, color: col(0xd8b08c), cap: 'round' });
  }

  // Bigfoot: a rare, distant walker on a wooded ridge of the beech forest, drawn in its own units
  // (ground at 0, about 40 tall, facing +x) and hazed like the ridge it walks on.
  // Shorter than the beeches on its ridge (they stand 0.025 to 0.045 of the screen there). Every ten minutes
  // there is a chance it steps out somewhere in view, walks left for 5 to 10 seconds and is gone behind a
  // tree again; it moves with the ridge as the wanderer walks.
  const BIGFOOT = { slot: 600, chance: 0.3, start: 240, seed: 615, height: 0.022, walk: [5, 10], speedU: 0.015 };
  // 0 outside [a, d], 1 inside [b, c], easing in and out between.
  const window4 = (x, a, b, c, d) => smooth(a, b, x) * (1 - smooth(c, d, x));
  const FORCED_BIGFOOT_S = 8;
  function bigfootPass(t, forcedAgeS) {
    if (forcedAgeS < FORCED_BIGFOOT_S) return { visit: -1 - Math.floor(t - forcedAgeS), age: forcedAgeS, length: FORCED_BIGFOOT_S, forced: true };
    const slot = Math.floor((t - BIGFOOT.start) / BIGFOOT.slot);
    if (slot < 0 || hash(slot, BIGFOOT.seed) > BIGFOOT.chance) return null;
    const length = lerp(BIGFOOT.walk[0], BIGFOOT.walk[1], hash(slot, BIGFOOT.seed + 1));
    const age = t - BIGFOOT.start - slot * BIGFOOT.slot;
    return age < length ? { visit: slot, age, length, forced: false } : null;
  }
  // Where on its ridge the current sighting began, in the ridge's own units, and whether it was reported.
  let bigfootAt = null;

  // Only ever a grey shape in the half-light of dawn or dusk, never seen clearly: a heavy forward-leaning
  // body, a small head, long arms, all one flat colour like the shadows around it.
  function drawBigfoot(g, color, phase) {
    g.clear();
    // A foot is lifted while it swings forward and planted while it moves back under the body; the other
    // way round it would glide backwards, a moonwalk.
    const swing = Math.sin(phase), lift = Math.max(0, -Math.cos(phase)), lift2 = Math.max(0, Math.cos(phase));
    const limb = (x1, y1, x2, y2, w) => g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: w, color, cap: 'round' });
    limb(-1, -18, -1 - swing * 7, -1 - lift * 2, 6.5);
    limb(1, -18, 1 + swing * 7, -1 - lift2 * 2, 6.5);
    g.ellipse(2, -27, 8.5, 11.5).fill(color);
    g.circle(6.5, -38.5, 5).fill(color);
    limb(3, -32, 4 + swing * 6, -16, 4.6);
    limb(0, -32, -2 - swing * 6, -16, 4.6);
  }

  // ---------- backpack ----------
  // A wanderer's pack: a soft, lumpy canvas sack cinched at the top, with a pocket, a metal buckle and a
  // sleeping bag rolled into a scroll and strapped across the top (seen end-on, a spiral). The same pack
  // is drawn on his back and standing at the camp; `at` maps its own units (as worn) to the drawing.
  // `open`: set down at camp, the bedroll is in the tent and the drawstring is undone, the top flap thrown
  // back and the mouth of the sack showing.
  function drawPack(g, at, { open = false } = {}) {
    const sm = pts => { const f = []; for (const p of smoothLoop(pts, 5)) f.push(...at(p[0], p[1])); return f; };
    const ln = (a, b, wd, col) => { const A = at(...a), B = at(...b); g.moveTo(A[0], A[1]).lineTo(B[0], B[1]).stroke({ width: wd, color: col, cap: 'round' }); };
    g.poly(sm([[-9, -37], [-13.5, -38.5], [-18.5, -36], [-20.6, -31], [-20, -26.5], [-23.2, -21], [-24.2, -14], [-22, -8.4], [-16, -6.2], [-10.5, -6.8], [-8.4, -9]])).fill(TC.pack);
    g.poly(sm([[-18.5, -36], [-20.6, -31], [-20, -26.5], [-23.2, -21], [-24.2, -14], [-22, -8.4], [-19.4, -7.4], [-20.6, -13], [-19.8, -20], [-17.8, -26], [-18, -31.5]])).fill(TC.packDark);
    g.poly(sm([[-21.8, -20], [-15.6, -20.6], [-14.6, -13.4], [-16.6, -9.6], [-21.4, -9.8], [-22.8, -14]])).fill(TC.packFlap);
    ln([-21.4, -16.2], [-15.2, -16.6], 1, TC.packDark);
    if (open) {
      // The mouth of the sack, and the flap thrown back over its far side.
      const mouth = at(-13.6, -37.2), m1 = at(-8.6, -37.2);
      g.ellipse(mouth[0], mouth[1], Math.abs(m1[0] - mouth[0]), Math.max(1, Math.abs(m1[0] - mouth[0]) * 0.32)).fill(TC.strap);
      g.poly(sm([[-18.2, -37.6], [-21.8, -34], [-22.6, -28], [-20, -27.4], [-18.6, -32.4], [-15.6, -36.6]])).fill(TC.packFlap);
      ln([-20.6, -28.2], [-20.2, -25.6], 1, TC.strap);
    } else {
      for (const [x, y] of [[-11, -37.6], [-14, -39.2], [-17, -37.8]]) g.poly(sm([[x - 1.6, y + 1.4], [x, y - 1.6], [x + 1.6, y + 1.4]])).fill(TC.packFlap);
      ln([-10, -36.4], [-18.4, -35.4], 1.1, TC.strap);
    }
    const buckle = at(-23.4, -24.5);
    g.circle(buckle[0], buckle[1], 2.3).fill(0x9aa0a6);
    ln([-23.4, -26.6], [-21.6, -28.4], 0.9, 0x9aa0a6);
    if (open) return;
    const rc = at(-15, -43.5), rr = 6.6;
    for (const x of [-20.2, -9.8]) ln([x, -43.5], [x + (x < -15 ? -0.6 : 0.6), -36.4], 1.6, TC.strap);
    g.circle(rc[0], rc[1], rr).fill(TC.roll);
    g.moveTo(rc[0], rc[1]);
    for (let k = 1; k <= 26; k++) { const a = k * 0.62, r = rr * 0.92 * k / 26; g.lineTo(rc[0] + Math.cos(a) * r, rc[1] + Math.sin(a) * r); }
    g.stroke({ width: 1.1, color: TC.rollDark });
    g.circle(rc[0], rc[1], rr).stroke({ width: 0.9, color: TC.rollDark });
  }

  // ---------- traveller ----------
  // A lanky, bearded wanderer in a long dark cape and a wide dark felt hat, with a canvas backpack.
  // The dark cape reads as a mysterious silhouette; the light canvas backpack and bedroll
  // keep him readable against dark forests and night scenes.
  const TC = {
    cape: 0x3b3338, capeDark: 0x2a2428,
    pack: 0x86704f, packDark: 0x65523a, packFlap: 0x75603f, strap: 0x4a3a2c, roll: 0xd9c7a3, rollDark: 0xa8946f, rollEnd: 0xe8d9ba,
    beard: 0x6d5847, beardDark: 0x56463a,
    shirt: 0xdccdaa, shirtDark: 0xbfae8a,
    pants: 0x3a3f52, pantsBack: 0x2b2f3e, boot: 0x5a3d28,
    // Brown felt hat, the same leather brown as the boots, with a woven band after the reference photo.
    hat: 0x5e3f2a, hatDark: 0x47301f, hatBand: 0x6e3a26, hatBandGold: 0xe7b45a, hatBandRed: 0xb4452e,
    skin: 0xe8b993, skinDark: 0xc9946f, hair: 0x5a4030,
    wood: 0xa88458, pipe: 0x4a3324, woodDark: 0x7d6040, mug: 0xdcd5c6,
  };
  const THIGH = 27, SHIN = 26, HIP_H = 55;
  let packTop = [0, -60];
  let pipeAt = null;
  // Hat shapes traced from a side-view photo of a cowboy hat (see drawUpper).
  const HAT_OUTLINE = [
    [-15.4, -3.8], [-13.05, -7.41], [-11.25, -9.58], [-9.99, -10.66], [-8.18, -11.65], [-8, -14.99], [-7.64, -15.53],
    [-6.02, -16.07], [-2.05, -16.8], [-0.06, -16.8], [2.1, -16.53], [3.55, -16.16], [6.8, -14.54], [7.52, -14.45],
    [7.88, -14.18], [8.24, -13.46], [8.6, -9.76], [13.65, -7.41], [14.74, -6.69], [16, -5.25], [16, -4.89],
    [15.46, -4.52], [14.92, -4.43], [13.65, -4.43], [8.24, -3.8], [2.1, -3.44], [-15.4, -3.44],
  ];
  const HAT_CROWN_SHADE = [
    [2.1, -16.53], [3.55, -16.16], [6.8, -14.54], [7.52, -14.45], [7.88, -14.18], [8.24, -13.46], [8.6, -9.76],
    [8.9, -8.6], [4.2, -8.2], [3.4, -13.6],
  ];
  const HAT_BAND = [
    [-8.18, -8.04], [-3.49, -7.86], [1.92, -7.77], [6.44, -8.22], [8.78, -8.59], [8.96, -6.24], [6.44, -6.15],
    [1.92, -6.51], [-3.49, -6.69], [-8, -6.78],
  ];
  // The folds where the near brim turns up meet the crown on both sides.
  const HAT_BRIM_FOLDS = [
    [[-15.1, -4], [-11.6, -5.2], [-8.1, -6.7]],
    [[8.95, -6.3], [12.6, -5.6], [15.8, -4.95]],
  ];
  const STUBBLE_DOTS = [
    [5.6, 5.0], [1.2, 3.6], [3.4, 6.2], [-0.6, 2.2], [7.0, 4.4], [2.2, 5.0], [4.6, 3.9], [0.4, 5.6],
    [6.2, 6.0], [-1.2, 3.9], [3.0, 3.2], [1.6, 6.6], [5.0, 6.8], [-0.2, 4.6], [6.8, 5.3], [2.8, 4.4],
    [4.0, 5.4], [0.8, 2.9], [3.8, 7.0], [7.4, 3.7], [-1.6, 2.8], [2.0, 2.6],
  ];
  // Closed Catmull-Rom spline through the given points, for soft outlines.
  function smoothLoop(pts, n) {
    const out = [], m = pts.length;
    for (let i = 0; i < m; i++) {
      const p0 = pts[(i - 1 + m) % m], p1 = pts[i], p2 = pts[(i + 1) % m], p3 = pts[(i + 2) % m];
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    return out;
  }
  function handFromAngles(sh, th, bend) {
    return [sh[0] + 14 * Math.sin(th) + 13 * Math.sin(th + bend), sh[1] + 14 * Math.cos(th) + 13 * Math.cos(th + bend)];
  }

  // Foot roll: heel strike with the toe up, flat foot, then the heel lifts and the foot pushes off
  // from the toe. The swing lift uses sin² so the foot arrives with zero vertical speed (no stomp).
  const HEEL_LIFT = 4;
  function footAt(q, amp, strideK = 1) {
    const st = STRIDE * amp * strideK;
    if (q < 0.6) {
      const k = smooth(0.4, 0.6, q), lift = HEEL_LIFT * k * amp;
      const strike = -0.3 * amp * (1 - smooth(0, 0.14, q));
      return { x: 0.5 + st - 2 * st * (q / 0.6), y: -lift, toe: strike + Math.asin(clamp(lift / 7)) };
    }
    const s = (q - 0.6) / 0.4, e = s * s * (3 - 2 * s), sw = Math.sin(Math.PI * s);
    return {
      x: 0.5 - st + 2 * st * e,
      y: -HEEL_LIFT * amp * (1 - e) - sw * sw * 7 * amp,
      toe: lerp(Math.asin(clamp(HEEL_LIFT * amp / 7)), -0.3 * amp, e),
    };
  }
  function drawLeg(g, hip, f, color) {
    const ax = f.x, ay = f.y - 3;
    const k = ik(hip.x, hip.y, ax, ay, THIGH, SHIN, -1);
    g.moveTo(hip.x, hip.y).lineTo(k[0], k[1]).lineTo(ax, ay).stroke({ width: 7.5, color, cap: 'round', join: 'round' });
    g.moveTo(lerp(k[0], ax, 0.74), lerp(k[1], ay, 0.74)).lineTo(ax, ay).stroke({ width: 8.6, color: TC.boot, cap: 'round' });
    const c = Math.cos(f.toe), s = Math.sin(f.toe);
    const pt = (x, y) => [ax + x * c - y * s, ay + x * s + y * c];
    const heel = pt(-2.5, 1.2), toe = pt(7, 1.2);
    g.moveTo(heel[0], heel[1]).lineTo(toe[0], toe[1]).stroke({ width: 5.5, color: TC.boot, cap: 'round' });
  }
  // Everything above the hips, drawn in a torso frame rotated by `lean` around the hip.
  function drawUpper(g, hip, lean, o) {
    const c = Math.cos(lean), sn = Math.sin(lean);
    const P_ = (x, y) => [hip.x + x * c - y * sn, hip.y + x * sn + y * c];
    const poly = (pts, color) => { const f = []; for (const [x, y] of pts) f.push(...P_(x, y)); g.poly(f).fill(color); };
    const arm = (sh, hand, color, skin) => {
      const S0 = P_(...sh), Hh = P_(...hand);
      const E = ik(S0[0], S0[1], Hh[0], Hh[1], 14, 13, 1);
      g.moveTo(S0[0], S0[1]).lineTo(E[0], E[1]).lineTo(Hh[0], Hh[1]).stroke({ width: 5.6, color, cap: 'round', join: 'round' });
      if (skin) g.circle(Hh[0], Hh[1], 2.7).fill(skin);
      return Hh;
    };

    arm([-1, -31], o.farHand, TC.capeDark, o.farHidden ? null : TC.skinDark);

    if (o.nearLeg && !o.legsFront) drawLeg(g, hip, o.nearLeg, TC.pants);

    poly([[-7, -34], [7, -34], [8.5, 0], [-7.5, 0]], TC.shirt);
    poly([[-8, -2.5], [9, -2.5], [9.5, 4], [-8.5, 4]], TC.pants);

    // Long cape down to mid-shin; its front edge follows the near leg and the back edge flutters.
    const fl = o.flutter, w = Math.sin(o.t * 3.1) * 0.9, len = o.capeLen ?? 24, fs = o.capeFront || 0;
    poly([[-9, -37], [7, -37.5], [9.5, -24], [11 + fs, len], [4, len + 2 + w], [-4, len + 1.5 - w], [-12 - fl, len - 2], [-14 - fl * 0.6, 0], [-11, -20]], TC.cape);
    poly([[-9, -37], [-1, -37.4], [-1.5, len + 1.8], [-4, len + 1.5 - w], [-12 - fl, len - 2], [-14 - fl * 0.6, 0], [-11, -20]], TC.capeDark);
    poly([[-5.5, -41], [6, -41.5], [7.5, -35], [-6.5, -35]], TC.capeDark);
    if (o.nearLeg && o.legsFront) drawLeg(g, hip, o.nearLeg, TC.pants);
    if (o.pack) {
      // A wanderer's pack: a soft, lumpy canvas sack cinched at the top, with a sleeping bag
      // rolled into a scroll and strapped across the top so it reads as a separate item.
      const bob = o.packBob || 0;
      drawPack(g, (x, y) => P_(x, y + bob));
      // The shoulder strap, only while he wears it.
      const s0 = P_(-6, -35 + bob), s1 = P_(8, -17 + bob);
      g.moveTo(s0[0], s0[1]).lineTo(s1[0], s1[1]).stroke({ width: 2.4, color: TC.strap, cap: 'round' });
      packTop = P_(-15, -50 + bob);
    }

    const hc = P_(3, -42.5), ang = lean * 0.4 + o.tilt;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const R = (x, y) => [hc[0] + x * ca - y * sa, hc[1] + x * sa + y * ca];
    g.circle(...R(-5, -1), 3.6).fill(TC.hair);
    g.circle(...R(-6.5, 2.5), 2.6).fill(TC.hair);
    g.circle(hc[0], hc[1], 6.8).fill(TC.skin);
    // Beard length 0..1: points below the jaw line are pulled up towards it, so a short beard
    // hugs the jaw; very short growth reads as stubble through transparency.
    // The beard starts as stubble: a scatter of dots along the jaw that fills in over the first days.
    // Around a fifth of the way to full the dots give way to a beard shape that keeps lengthening.
    // No moustache at any length.
    const beard = state.beard;
    const stubble = smooth(0, 0.18, beard) * (1 - smooth(0.2, 0.32, beard));
    if (stubble > 0.01) {
      const shown = Math.ceil(STUBBLE_DOTS.length * smooth(0, 0.14, beard));
      for (let k = 0; k < shown; k++) {
        const [x, y] = STUBBLE_DOTS[k];
        g.circle(...R(x, y), 0.5).fill({ color: TC.beardDark, alpha: 0.85 * stubble });
      }
    }
    const grown = smooth(0.2, 0.32, beard);
    if (grown > 0.01) {
      const B = (x, y) => R(x, y <= 4.5 ? y : lerp(4.5, y, beard));
      const bw = -o.wind * 0.8 * beard;
      g.poly([...B(-1.5, 0.5), ...B(2, 3.5), ...B(5, 4.6), ...B(7.6, 3.8), ...B(8, 6), ...B(5.8 + bw, 10.5), ...B(1.5 + bw, 12), ...B(-2.5, 7.5)]).fill({ color: TC.beard, alpha: grown });
      g.poly([...B(-1.5, 0.5), ...B(0.5, 3), ...B(0 + bw, 11), ...B(-2.5, 7.5)]).fill({ color: TC.beardDark, alpha: grown });
    }
    // Cowboy hat seen from the side, traced from a reference photo (head frame, units of the figure).
    // HAT_OUTLINE is the whole silhouette: the far brim rising beside the crown, the crown, the near brim.
    // Worn a little cheekily: pulled down towards the eyes and tipped slightly forward.
    const HAT_TIP = 0.11, HAT_DROP = 2.2;
    const ct = Math.cos(HAT_TIP), st = Math.sin(HAT_TIP);
    const hp = pts => { const f = []; for (const [x, y] of pts) f.push(...R(x * ct - y * st, x * st + y * ct + HAT_DROP)); return f; };
    g.poly(hp(HAT_OUTLINE)).fill(TC.hat);
    g.poly(hp(HAT_CROWN_SHADE)).fill(TC.hatDark);
    g.poly(hp(HAT_BAND)).fill(TC.hatBand);
    // Woven pattern of the band: a gold zigzag with a thin red one beside it, as on the photo's band.
    const bandEdge = (x, top) => (top ? lerp(-7.75, -8.35, (x + 8) / 17) : lerp(-6.95, -6.45, (x + 8) / 17));
    for (const [color, shift, width] of [[TC.hatBandGold, 0, 0.55], [TC.hatBandRed, 0.7, 0.35]]) {
      const zig = [];
      for (let x = -7.6, up = true; x <= 8.6; x += 1.1, up = !up) zig.push([x + shift * 0.5, up ? bandEdge(x, true) + 0.35 : bandEdge(x, false) - 0.35]);
      const pts = hp(zig);
      g.moveTo(pts[0], pts[1]);
      for (let k = 2; k < pts.length; k += 2) g.lineTo(pts[k], pts[k + 1]);
      g.stroke({ width, color, join: 'miter' });
    }
    for (const fold of HAT_BRIM_FOLDS) {
      const pts = hp(fold);
      g.moveTo(pts[0], pts[1]);
      for (let k = 2; k < pts.length; k += 2) g.lineTo(pts[k], pts[k + 1]);
    }
    g.stroke({ width: 0.7, color: TC.hatDark, cap: 'round', join: 'round' });


    // Pipe held in the teeth while walking: the stem leaves the mouth and the bowl hangs just below the beard.
    if (o.pipeInMouth) {
      const mouth = R(6.6, 4.6), bowl = R(11.6, 7.4);
      g.moveTo(mouth[0], mouth[1]).lineTo(bowl[0] - 0.6, bowl[1] - 1.4).stroke({ width: 1.4, color: TC.pipe, cap: 'round' });
      g.roundRect(bowl[0] - 1.9, bowl[1] - 2.4, 3.8, 4.6, 1.2).fill(TC.pipe);
      g.ellipse(bowl[0], bowl[1] - 2.3, 1.5, 0.6).fill({ color: 0xff8a3a, alpha: 0.45 + 0.35 * Math.sin(o.t * 1.7) ** 2 });
      pipeAt = { bowl, mouth };
    }
    // A stalk between the lips with an ear of grain at its tip, bobbing a little with each step.
    if (o.grassInMouth) {
      const a = R(6.4, 4.4), b = R(13.4, 2.6 + Math.sin(o.t * 5) * 0.6);
      g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: 0.7, color: 0xd8c27a, cap: 'round' });
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const dx = (b[0] - a[0]) / len, dy = (b[1] - a[1]) / len;
      const E = (u, v) => [b[0] + dx * u - dy * v, b[1] + dy * u + dx * v];
      // Grains in two staggered rows along the ear, then a few awns past the tip.
      for (let k = 0; k < 4; k++) {
        const u = 0.5 + k * 0.85, side = k % 2 ? 0.45 : -0.45;
        const [cx, cy] = E(u, side);
        g.ellipse(cx, cy, 0.8, 0.8).fill(0xb8923a);
      }
      g.poly([...E(0, 0), ...E(1.4, -0.65), ...E(3.4, -0.4), ...E(4.2, 0), ...E(3.4, 0.4), ...E(1.4, 0.65)]).fill(0xc9a245);
      for (const v of [-0.5, 0, 0.5]) {
        const [x0, y0] = E(3.6, v * 0.6), [x1, y1] = E(6.4, v * 2.2);
        g.moveTo(x0, y0).lineTo(x1, y1);
      }
      g.stroke({ width: 0.35, color: 0xd8c27a, cap: 'round' });
    }
    const nh = arm([3, -31], o.nearHand, TC.cape, TC.skin);
    // Leather waterskin in the near hand, tipped up to the mouth as he drinks.
    if (o.flask > 0.02) {
      const tip = -0.9 * o.flask;
      const c = Math.cos(tip), sn2 = Math.sin(tip);
      const F = (x, y) => [nh[0] + x * c - y * sn2, nh[1] + x * sn2 + y * c];
      g.poly([...F(-1, -1), ...F(-2.6, 3), ...F(-1.2, 7), ...F(2.6, 7.4), ...F(3.4, 3), ...F(1.4, -1)]).fill(0x7a5236);
      g.poly([...F(-0.6, -1), ...F(1, -1), ...F(0.8, -3), ...F(-0.4, -3)]).fill(0x4a3324);
      g.circle(nh[0], nh[1], 2.7).fill(TC.skin);
    }
    // Pipe: the bowl sits in the hand; the stem reaches the mouth when he draws on it.
    if (o.pipe !== undefined) {
      const puff = o.pipe;
      const bowl = [nh[0] + 2.2, nh[1] - 2.2];
      const mouth = R(6.6, 4.6);
      const tip = [lerp(bowl[0] - 6.5, mouth[0], puff), lerp(bowl[1] - 2.5, mouth[1], puff)];
      g.moveTo(bowl[0] - 1, bowl[1] - 1).lineTo(tip[0], tip[1]).stroke({ width: 1.4, color: TC.pipe, cap: 'round' });
      g.roundRect(bowl[0] - 1.9, bowl[1] - 2.4, 3.8, 4.6, 1.2).fill(TC.pipe);
      g.ellipse(bowl[0], bowl[1] - 2.3, 1.5, 0.6).fill({ color: 0xff8a3a, alpha: 0.35 + 0.65 * puff });
      pipeAt = { bowl, mouth };
    }
    if (o.mug) {
      g.roundRect(nh[0] - 3.2, nh[1] - 6, 6.4, 7.5, 1.6).fill(TC.mug);
      g.circle(nh[0] + 4, nh[1] - 2.5, 2).stroke({ width: 1.3, color: TC.mug });
    }
    return nh;
  }
  // pipeInMouth: walking with the pipe in his teeth; lookUp 0..1: stopped, raising his head to the view.
  // `act` holds the little things he does on the road, each 0..1 (how far into the gesture he is):
  // pipe/grass (in his mouth), lookUp (stopped to take in the view), drink (waterskin), strap (tugging the
  // backpack straps), hat (straightening the hat) and stretch (morning stretch with a yawn, standing still).
  function drawWalker(g, p, s, t, wind, sprig, act = {}) {
    g.clear();
    pipeAt = null;
    const amp = Math.sqrt(s);
    const { pipe = false, grass = false, lookUp = 0, drink = 0, strap = 0, hat = 0, stretch = 0, packing = 0, kickBack = 0, kick = 0, gale = 0 } = act;
    g.ellipse(2, 0, 15, 2.4).fill({ color: 0x000000, alpha: 0.22 });
    // Springy gait: the hip rises more than a heavy hiker's would.
    const hip = { x: 0, y: -HIP_H + 1.6 * amp * (0.5 + 0.5 * Math.cos(2 * p - 0.3)) - stretch * 1.5 };
    const qA = mod(p / (Math.PI * 2), 1), qB = mod(qA + 0.5, 1);
    let fA = footAt(qA, amp, galeStride(gale)), fB = footAt(qB, amp, galeStride(gale));
    // Standing still the stride shrinks to nothing and both feet would land on one spot, reading as a
    // single leg; as he slows down they settle a hip's width apart instead.
    const stand = 1 - clamp(amp * 2.5);
    fA = { ...fA, x: fA.x + 6.5 * stand };
    fB = { ...fB, x: fB.x - 6.5 * stand };
    // Kicking the pebble hard: the near leg draws back with a bent knee (kickBack), then snaps through
    // nearly straight to well ahead of vertical, toe up (kick), while the other foot stays planted under
    // him. A bent knee at the strike or a foot close under the coat read as a high step or a stumble.
    if (kickBack > 0 || kick > 0) {
      const plant = Math.max(kickBack, kick);
      fA = { x: lerp(fA.x, -14, kickBack), y: lerp(fA.y, -10, kickBack), toe: lerp(fA.toe, 0.7, kickBack) };
      fA = { x: lerp(fA.x, 30, kick), y: lerp(fA.y, -12, kick), toe: lerp(fA.toe, -0.6, kick) };
      fB = { x: lerp(fB.x, -2, plant), y: lerp(fB.y, 0, plant), toe: lerp(fB.toe, 0, plant) };
    }
    drawLeg(g, hip, fB, TC.pantsBack);
    // In a gust, or now and then to straighten it, the free hand goes up to the hat; otherwise it's in a pocket.
    // In a gale it holds the hat all the time instead of going up and down with every gust.
    const hatK = Math.max(smooth(0.84, 0.96, wind) * (1 - gale), hat, gale);
    const pocket = [-0.5 + Math.cos(p) * 1.5 * amp, -6];
    const swing = handFromAngles([3, -31], 0.05 - 0.38 * amp * Math.cos(p), 0.4);
    const tug = strap * (0.5 + 0.5 * Math.sin(t * 9)) * 1.5;
    let farHand = [lerp(pocket[0], 11, hatK), lerp(pocket[1], -50, hatK)];
    let nearHand = [lerp(swing[0], 10.5, drink), lerp(swing[1], -39, drink)];
    // Tugging the straps: both hands grip the straps at the chest and pull them down a little.
    farHand = [lerp(farHand[0], 1, strap), lerp(farHand[1], -27 + tug, strap)];
    nearHand = [lerp(nearHand[0], 6, strap * (1 - drink)), lerp(nearHand[1], -25 + tug, strap * (1 - drink))];
    // Packing up: bent forward, both hands low in front, busy rolling and tying things.
    const work = Math.sin(t * 6) * 2;
    farHand = [lerp(farHand[0], 12, packing), lerp(farHand[1], -10 + work, packing)];
    nearHand = [lerp(nearHand[0], 17, packing), lerp(nearHand[1], -12 - work, packing)];
    // Morning stretch: both arms up over the head.
    farHand = [lerp(farHand[0], -3, stretch), lerp(farHand[1], -64, stretch)];
    nearHand = [lerp(nearHand[0], 7, stretch), lerp(nearHand[1], -65, stretch)];
    // In a gale he leans his body forward into the wind and keeps his head down.
    drawUpper(g, hip, 0.02 + 0.03 * amp - stretch * 0.06 + packing * 0.35 + gale * 0.14, {
      farHand, farHidden: hatK < 0.3 && strap < 0.3 && stretch < 0.3 && packing < 0.3,
      nearHand, pack: true, packBob: Math.cos(2 * p - 0.8) * 0.8 * amp, nearLeg: fA, capeFront: (fA.x - 2) * 0.35, t, wind, sprig,
      flutter: wind * 2.2 + Math.sin(t * 4) * 0.8 + amp,
      tilt: Math.sin(2 * p) * 0.035 - lookUp * 0.22 - drink * 0.3 - stretch * 0.32 + packing * 0.2 + kickBack * 0.04 - kick * 0.1 + gale * 0.06,
      pipeInMouth: pipe && drink < 0.3, grassInMouth: grass && drink < 0.3, flask: drink,
    });
  }
  // pipeK: how much he is busy with the pipe (vs. the mug); puff: the pipe raised to the mouth.
  function drawSitter(g, t, pipeK, puff, sipK, lookK, wind, sprig) {
    g.clear();
    pipeAt = null;
    const hip = { x: -2, y: -24 };
    drawLeg(g, hip, { x: 14, y: 0, toe: 0 }, TC.pantsBack);
    const mugT = [lerp(13, 9, sipK), lerp(-20, -33, sipK)];
    const pipeHand = [lerp(15, 11.5, puff), lerp(-22, -35.5, puff)];
    const nearHand = [lerp(mugT[0], pipeHand[0], pipeK), lerp(mugT[1], pipeHand[1], pipeK)];
    const farHand = [lerp(mugT[0] - 1, 9, pipeK), lerp(mugT[1] + 1.5, -17, pipeK)];
    const usingPipe = pipeK >= 0.5;
    return drawUpper(g, hip, 0.17 + Math.sin(t * 1.3) * 0.015 - (usingPipe ? 0 : sipK * 0.12), {
      farHand, nearHand, nearLeg: { x: 21, y: 0, toe: 0 }, legsFront: true, capeLen: 8,
      mug: !usingPipe, pipe: usingPipe ? puff : undefined, t, wind, sprig, flutter: wind * 1.5 + Math.sin(t * 1.1) * 0.6,
      tilt: usingPipe ? -puff * 0.12 + Math.sin(t * 0.37) * 0.03 : -sipK * 0.28 - lookK * 0.38 + Math.sin(t * 0.37) * 0.04,
    });
  }

  // A small bird that now and then keeps the wanderer company: it perches on the backpack or on the tent
  // ridge. Every species shares one shape and size and differs only in colours.
  // Order matches BIRD_IDS, which the dev panel uses to call a chosen species.
  const BIRD_IDS = ['birdStarling', 'birdRobin', 'birdTit', 'birdChaffinch', 'birdSparrow'];
  // The same species as reported to the game when one perches (see BIRD_SPECIES in src/shared).
  const BIRD_KEYS = ['starling', 'robin', 'tit', 'chaffinch', 'sparrow'];
  // The visit whose perching bird was last reported, so each visit is reported once.
  let birdReported = null;
  const BIRD_SPECIES = [
    // Starling: dark, glossy, speckled, yellow beak.
    { back: 0x2b2a35, tail: 0x24232c, wing: 0x3a3946, head: 0x2b2a35, beak: 0xe0b84a, spots: 0xcfd0d8 },
    // Robin: olive-brown with an orange face and breast.
    { back: 0x7a6a52, tail: 0x5e5040, wing: 0x6a5a44, head: 0x7a6a52, beak: 0x3a3028, breast: 0xd9773a, cheek: 0xd9773a },
    // Great tit: black head with a white cheek, yellow breast, blue-grey wings.
    { back: 0x8f9c4a, tail: 0x4f6272, wing: 0x5f7a8a, head: 0x1f1f24, beak: 0x2a2a2a, breast: 0xe6c43a, cheek: 0xf2f0ea },
    // Chaffinch: blue-grey head, rosy breast, dark wing with a white bar.
    { back: 0x8a6a4a, tail: 0x3a3430, wing: 0x3a3430, head: 0x6f8199, beak: 0x9aa0a8, breast: 0xc98a72, bar: 0xf0ece2 },
    // House sparrow: brown back, grey crown, pale breast, streaked wing.
    { back: 0x8a6a4a, tail: 0x5e4630, wing: 0x6e4f36, head: 0x8b8b88, beak: 0x3a3028, breast: 0xc4b8a2, bar: 0xd8cbb0 },
  ];
  function drawBird(g, x, y, s, face, flying, flap, sp = BIRD_SPECIES[0]) {
    const X = u => x + u * s * face, Y = v => y + v * s;
    g.poly([X(-4), Y(-3.5), X(-10.5), Y(-5.5), X(-10), Y(-2.2)]).fill(sp.tail);
    g.ellipse(x, Y(-4), 5.5 * s, 3.6 * s).fill(sp.back);
    if (sp.breast) g.ellipse(X(2), Y(-3), 3.4 * s, 2.5 * s).fill(sp.breast);
    if (sp.spots) g.circle(X(1), Y(-5), 0.55 * s).fill(sp.spots).circle(X(-1.8), Y(-3.4), 0.5 * s).fill(sp.spots).circle(X(2.4), Y(-2.8), 0.45 * s).fill(sp.spots);
    g.circle(X(4.5), Y(-7), 2.8 * s).fill(sp.head);
    if (sp.cheek) g.ellipse(X(4.6), Y(-6.2), 1.6 * s, 1.2 * s).fill(sp.cheek);
    g.circle(X(5.6), Y(-7.7), 0.6 * s).fill(0xf0f0f0);
    g.circle(X(5.7), Y(-7.7), 0.3 * s).fill(0x141414);
    g.poly([X(6.8), Y(-7.8), X(10.2), Y(-6.9), X(6.8), Y(-6.1)]).fill(sp.beak);
    if (flying) {
      const wy = Math.sin(flap) * 7;
      g.poly([X(-2.5), Y(-5), X(2.5), Y(-5), X(-1), Y(-5 - wy)]).fill(sp.wing);
    } else {
      g.poly([X(-3.5), Y(-5.8), X(2.5), Y(-5.6), X(-5.5), Y(-2.6)]).fill(sp.wing);
      if (sp.bar) g.poly([X(-2.2), Y(-5.2), X(0.8), Y(-5.1), X(-2.6), Y(-4.3)]).fill(sp.bar);
      g.moveTo(X(-0.5), Y(-1)).lineTo(X(-0.5), Y(0)).moveTo(X(1.5), Y(-1)).lineTo(X(1.5), Y(0)).stroke({ width: Math.max(1, 0.6 * s), color: 0x8a6a3a });
    }
  }
  // The wanderer's cat: a big, fluffy black tomcat with large yellow eyes, drawn in its own units
  // (ground at 0, facing +x, ear tips about 21 up) and scaled so it reaches above the wanderer's knee.
  // Poses: walk and trot (diagonal gait with a raised, hooked tail), sit,
  // wash (a front paw raised to the face), loaf (lying on the backpack, tail hanging down), curl (asleep
  // by the fire, tail round the nose), stretch (the morning bow) and leap. Eyes, pupils and glints go to
  // their own graphic so firelight can brighten them.
  const CAT_SCALE = 1.4;
  const CAT = { fur: 0x211e26, far: 0x17151b, sheen: 0x3a3542, ear: 0x52363f, nose: 0x6a4250, eye: 0xf5c542, pupil: 0x17121a, whisker: 0x8e8a96 };
  const CAT_JUMPER = { wool: 0xa5462c, stripe: 0xe8dcc0, collar: 0x84361f };
  const CAT_CAPE = { coat: 0xe2ad22, shade: 0xb8851a, sheen: 0xf5d566 };
  function drawCat(g, eg, pose, face, phase, o = {}) {
    const { look = [0, 0], shut = false, t = 0, coat = false, cape = false } = o;
    g.clear(); eg.clear();
    const X = (u) => u * face, Y = (v) => -v;
    const blob = (cx, cy, rx, ry, rot = 0, color = CAT.fur, fluff = 0.035) => {
      const pts = [];
      for (let k = 0; k < 30; k++) {
        const a = (k / 30) * Math.PI * 2, f = 1 + fluff * Math.sin(a * 9);
        const ex = Math.cos(a) * rx * f, ey = Math.sin(a) * ry * f;
        pts.push(X(cx + ex * Math.cos(rot) - ey * Math.sin(rot)), Y(cy + ex * Math.sin(rot) + ey * Math.cos(rot)));
      }
      g.poly(pts).fill(color);
    };
    // A fluffy tail: overlapping discs along a curve, fullest just past the base and tapering to a
    // narrow tip, so it never ends in a knob.
    const tail = (a, c, b, r0) => {
      for (let k = 0; k <= 24; k++) {
        const q = k / 24, [px, py] = qbez(a, c, b, q);
        g.circle(X(px), Y(py), r0 * (1 + 0.3 * Math.sin(q * Math.PI * 0.8)) * (1 - 0.72 * q * q)).fill(CAT.fur);
      }
    };
    // On a frosty day the cat wears a knitted jumper over the whole body, chest and rump included, with
    // two cream stripes and a rolled collar at the neck. Only the legs, the tail and the head come out of
    // it, so it is still plainly the same cat. `front` is an extra piece for a chest that sticks out.
    const jumper = (cx, cy, rx, ry, rot = 0, collar = null, front = null) => {
      if (!coat) return;
      blob(cx, cy, rx, ry, rot, CAT_JUMPER.wool, 0.02);
      if (front) blob(front[0], front[1], front[2], front[3], front[4] ?? 0, CAT_JUMPER.wool, 0.02);
      for (const dy of [-0.25, 0.2]) blob(cx + dy * ry * Math.sin(rot), cy + dy * ry * Math.cos(rot), rx * 0.92, ry * 0.11, rot, CAT_JUMPER.stripe, 0);
      if (collar) blob(collar[0], collar[1], collar[2], collar[3], collar[4] ?? 0, CAT_JUMPER.collar, 0.05);
    };
    // In the rain a yellow oilskin cape: it lies over the back like a poncho, a little wider than the body,
    // and hangs to a straight hem below the middle of it, over the jumper when there is one too. The hood
    // is drawn with the head.
    const raincape = (cx, cy, rx, ry, rot = 0) => {
      if (!cape) return;
      const P = (ex, ey) => [X(cx + ex * Math.cos(rot) - ey * Math.sin(rot)), Y(cy + ex * Math.sin(rot) + ey * Math.cos(rot))];
      const hem = -ry * 0.45, pts = [];
      for (let k = 0; k <= 20; k++) {
        const a = Math.PI * (k / 20);
        pts.push(...P(Math.cos(a) * rx * 1.1, Math.max(hem, Math.sin(a) * ry * 1.14)));
      }
      pts.push(...P(-rx * 1.06, hem), ...P(rx * 1.06, hem));
      g.poly(pts).fill(CAT_CAPE.coat);
      g.poly([...P(-rx * 1.06, hem), ...P(rx * 1.06, hem), ...P(rx * 1.02, hem + ry * 0.16), ...P(-rx * 1.02, hem + ry * 0.16)]).fill(CAT_CAPE.shade);
      // The rain runs off its shiny shoulders.
      const sheen = [];
      for (let k = 4; k <= 12; k++) { const a = Math.PI * (k / 20); sheen.push(...P(Math.cos(a) * rx * 0.8, Math.sin(a) * ry * 0.86)); }
      for (let k = 12; k >= 4; k--) { const a = Math.PI * (k / 20); sheen.push(...P(Math.cos(a) * rx * 0.62, Math.sin(a) * ry * 0.64)); }
      g.poly(sheen).fill(CAT_CAPE.sheen);
    };
    const leg = (hx, hy, fx, fy, w, color = CAT.fur) => {
      g.moveTo(X(hx), Y(hy)).lineTo(X(fx), Y(fy + w * 0.4)).stroke({ width: w, color, cap: 'round' });
      g.ellipse(X(fx + 0.5), Y(fy + w * 0.42), w * 0.7, w * 0.45).fill(color);
      if (!cape) return;
      // Little yellow wellingtons with the cape, over the paws only.
      const boot = color === CAT.far ? CAT_CAPE.shade : CAT_CAPE.coat;
      g.ellipse(X(fx + 0.6), Y(fy + w * 0.45), w * 0.82, w * 0.56).fill(boot);
      g.moveTo(X(fx - w * 0.1), Y(fy + w * 0.95)).lineTo(X(fx + w * 0.9), Y(fy + w * 0.95)).stroke({ width: w * 0.28, color: CAT_CAPE.shade, cap: 'round' });
    };
    const head = (hx, hy, tilt = 0, lying = false) => {
      hx += look[0] * 0.6; hy += look[1] * 0.8;
      const R = (x, y) => [hx + x * Math.cos(tilt) - y * Math.sin(tilt), hy + x * Math.sin(tilt) + y * Math.cos(tilt)];
      const tri = (pts, color) => g.poly(pts.flatMap(([x, y]) => { const [u, v] = R(x, y); return [X(u), Y(v)]; })).fill(color);
      const ear = lying ? 0.75 : 1;
      const ears = (lift, far, near, inner) => {
        tri([[-3.8, 2 + lift], [-3.3, 2 + lift + 5.8 * ear], [-0.5, 4.2 + lift]], far);
        tri([[0.3, 4.4 + lift], [3, 4.4 + lift + 4 * ear], [4.7, 2.6 + lift]], near);
        tri([[1.1, 4.4 + lift], [3, 4.4 + lift + 2.9 * ear], [3.9, 3 + lift]], inner);
      };
      if (!cape) ears(0, CAT.far, CAT.fur, CAT.ear);
      const c = R(0, 0); blob(c[0], c[1], 5.5, 4.7, tilt);
      const ch = R(-0.4, -1.7); blob(ch[0], ch[1], 5.3, 3.1, tilt, CAT.fur, 0.07);
      if (cape) {
        // The hood: over the crown and the back of the head, down to the cheek, with a stiff brim just
        // above the eyes, so the face looks out of it.
        tri([[-5.9, -3], [-6.9, 0.8], [-5.6, 4.6], [-3, 6.9], [0.8, 7.5], [3.6, 6.2], [5.4, 3.8], [3.7, 2.7], [0.6, 3.1], [-1.4, 1.3], [-2.4, -2.6], [-3.6, -4.3]], CAT_CAPE.coat);
        tri([[5.4, 3.8], [3.7, 2.7], [0.6, 3.1], [0.9, 3.9], [3.6, 3.6]], CAT_CAPE.shade);
        tri([[-4.8, 3.6], [-2.6, 5.9], [0.2, 6.5], [-2.3, 5.1]], CAT_CAPE.sheen);
        // The hood has ears of its own, raised by its thickness so they stick out as far as the cat's do.
        ears(2.6, CAT_CAPE.shade, CAT_CAPE.coat, CAT_CAPE.sheen);
      } else {
        const sh = R(-1.2, 2.6); blob(sh[0], sh[1], 2.8, 1.2, tilt + 0.25, CAT.sheen, 0);
      }
      tri([[4.6, -0.2], [5.6, -0.1], [5.1, -0.9]], CAT.nose);
      for (const [dy, ex] of [[0.4, 9.4], [-0.6, 9.6], [-1.6, 9]]) {
        const a = R(4.6, -1), b = R(ex, dy - 1.2 + (dy - 0.4) * 0.6);
        g.moveTo(X(a[0]), Y(a[1])).lineTo(X(b[0]), Y(b[1]));
      }
      g.stroke({ width: 0.25, color: CAT.whisker, cap: 'round' });
      for (const [ex, ey, rx] of [[1.3, 0.7, 1.25], [3.9, 0.6, 1.1]]) {
        const [u, v] = R(ex, ey);
        if (shut) {
          eg.moveTo(X(u - rx), Y(v)).quadraticCurveTo(X(u), Y(v - 0.7), X(u + rx), Y(v));
          eg.stroke({ width: 0.4, color: 0x5d5864, cap: 'round' });
        } else {
          eg.ellipse(X(u), Y(v), rx, 1.5).fill(CAT.eye);
          eg.ellipse(X(u + look[0] * 0.35 * face * face + 0.15), Y(v + look[1] * 0.3), 0.4, 1.1).fill(CAT.pupil);
          eg.circle(X(u + 0.45), Y(v + 0.65), 0.32).fill(0xffffff);
        }
      }
    };
    if (pose === 'walk' || pose === 'trot') {
      const trot = pose === 'trot';
      const amp = trot ? 4.2 : 3, lift = trot ? 2.2 : 1.4, bob = trot ? 0.8 : 0.35;
      const sway = Math.sin(t * 1.3) * 1.2;
      const by = 9 - Math.abs(Math.sin(phase)) * bob;
      if (trot) tail([-10, by + 1.5], [-17, by + 4], [-20 + sway * 0.5, by + 8.5], 2.4);
      else tail([-10, by + 1.5], [-17, by + 9], [-12.5 + sway, by + 16.5], 2.4);
      const foot = (hx, off) => [hx + Math.sin(phase + off) * amp, Math.max(0, Math.cos(phase + off)) * lift];
      leg(-6.5, by - 2, ...foot(-6.5, 0), 3, CAT.far);
      leg(6.5, by - 2, ...foot(6.5, Math.PI * 0.5), 3, CAT.far);
      blob(-1, by, 10.5, 5.4);
      blob(-6.5, by + 2.6, 3.8, 2.4);
      blob(5.6, by + 3.4, 3.2, 2.2);
      blob(-2.5, by + 3.4, 6, 1.4, 0.05, CAT.sheen, 0);
      leg(-5.5, by - 2, ...foot(-5.5, Math.PI), 3.2);
      leg(7.5, by - 2, ...foot(7.5, Math.PI * 1.5), 3.2);
      blob(6.8, by - 1, 4.4, 4.6);
      jumper(-0.6, by + 0.3, 10.6, 5.7, 0, [9.6, by + 1.6, 1.8, 4.6], [6.8, by - 0.6, 4.3, 4.4]);
      raincape(0, by + 0.6, 11, 5.6);
      head(11.6, by + 4 + Math.sin(phase * 2) * 0.25);
    } else if (pose === 'sit' || pose === 'wash') {
      const flick = Math.sin(t * 2.2) * 0.7;
      const wrapTail = () => tail([-8.5, 2], [-1, -1.2], [8.8, 1.6 + flick], 2.4);
      wrapTail();
      blob(-2.5, 6.6, 7, 6.6);
      blob(-4.6, 10, 3.6, 1.4, 0.4, CAT.sheen, 0);
      g.ellipse(X(-0.5), Y(1), 3.2, 1.3).fill(CAT.fur);
      leg(4.8, 7, 5, 0, 2.7, CAT.far);
      blob(3.8, 10.2, 4.8, 7.4, -0.15);
      jumper(-2.2, 6.9, 7.8, 6.6, 0, [4, 16, 3.7, 1.6, -0.15], [3.6, 9.2, 4.8, 6.6, -0.15]);
      raincape(0.2, 9.6, 8.4, 7.4);
      // The jumper and the cape reach down low, so the tail wrapped round the paws comes out over them.
      if (coat || cape) wrapTail();
      if (pose === 'wash') {
        // Licks the raised paw in quick strokes: the paw rises to the mouth and over the cheek, the head
        // dips to meet it.
        const lick = 0.5 + 0.5 * Math.sin(t * 7);
        // The head goes first so the paw is drawn over the face, where it shows.
        head(lerp(6.6, 6, lick), lerp(16.6, 17.6, lick), lerp(-0.42, -0.2, lick));
        leg(6.4, 9, lerp(9.8, 9, lick), lerp(12.6, 17.2, lick), 3.2);
        g.ellipse(X(lerp(10.3, 9.5, lick)), Y(lerp(13.4, 18, lick)), 2.3, 1.7).fill(CAT.sheen);
      } else {
        leg(6.6, 7, 7, 0, 2.9);
        head(5.6, 18.6);
      }
    } else if (pose === 'loaf') {
      tail([-8, 4], [-11.5, -1], [-9.5 + Math.sin(t * 1.1) * 0.8, -8], 2.3);
      blob(0, 5.2, 9.5, 5.2);
      blob(-2, 8.2, 5.5, 1.4, 0.05, CAT.sheen, 0);
      jumper(-0.2, 5.4, 9.6, 5.1, 0, [8.6, 6.4, 1.5, 4]);
      raincape(0, 5.6, 9.8, 5.2);
      blob(7.6, 1.6, 2.6, 1.3, 0, cape ? CAT_CAPE.coat : CAT.fur);
      head(8.2, 10.2);
    } else if (pose === 'curl') {
      const br = 1 + Math.sin(t * 1.5) * 0.03;
      blob(0, 5.2 * br, 11, 5.6 * br);
      blob(-2, 8.6 * br, 6, 1.6, 0.08, CAT.sheen, 0);
      jumper(-0.4, 5.3 * br, 10.6, 5.5 * br);
      raincape(-0.4, 5.4 * br, 10.8, 5.6 * br);
      head(7.6, 5.4, -0.15, true);
      tail([-10.5, 2.5], [-1, -1.4], [11, 2.6], 2.7);
    } else if (pose === 'stretch') {
      tail([-9, 11], [-13.5, 17], [-10.5, 22.5], 2.4);
      leg(-7, 10, -7.6, 0, 3, CAT.far);
      leg(5.5, 4, 13, 0, 2.8, CAT.far);
      blob(-1, 7.4, 10.5, 4.3, -0.38);
      jumper(-1, 7.5, 10.3, 4.3, -0.38, [8.6, 3.9, 1.5, 3.7, -0.38]);
      raincape(-1, 7.6, 10.4, 4.4, -0.38);
      leg(-6, 10, -5.5, 0, 3.2);
      leg(6.5, 4, 14.4, 0, 3);
      head(12.2, 5.6, 0.1);
    } else if (pose === 'leap') {
      tail([-10, 10], [-16, 12], [-22, 12.6], 2.3);
      leg(-7, 8, -14, 3.5, 3, CAT.far);
      leg(7, 8, 14, 3, 3, CAT.far);
      blob(0, 9, 11.5, 4.8, 0.1);
      jumper(0, 9.1, 11.2, 4.8, 0.1, [10.6, 10.3, 1.6, 4.3, 0.1]);
      raincape(0, 9.3, 11.4, 4.9, 0.1);
      leg(-6, 8, -13, 2.5, 3.2);
      leg(8, 8, 15.2, 4, 3.2);
      head(12.6, 12.8);
    }
  }
  const qbez = (a, c, b, k) => [lerp(lerp(a[0], c[0], k), lerp(c[0], b[0], k), k), lerp(lerp(a[1], c[1], k), lerp(c[1], b[1], k), k)];

  const trav = new Container();
  const pebbleG = new Graphics();
  // Pebbles on the path (ground position in route units). Only one at a time waits to be kicked; kicked
  // ones stay until they leave the screen, which takes most of a minute, so they must not block the next.
  let pebbles = [];
  const travG = new Graphics(); trav.addChild(travG);
  const birdG = new Graphics();
  const catC = new Container(), catG = new Graphics(), catEyeG = new Graphics();
  catC.addChild(catG, catEyeG);

  // ---------- camp ----------
  const tentC = new Container();
  tentC.addChild(new Graphics()
    .ellipse(0, 1, 52, 4).fill({ color: 0x000000, alpha: 0.22 })
    .moveTo(0, -56).lineTo(-60, 0).stroke({ width: 1, color: 0x6b5a48 })
    .moveTo(0, -56).lineTo(60, 0).stroke({ width: 1, color: 0x6b5a48 })
    .rect(-61, -3, 2, 4).fill(0x5a4836).rect(59, -3, 2, 4).fill(0x5a4836)
    .poly([-44, 0, 0, -56, 44, 0]).fill(0xc9a46a)
    .poly([0, -56, 44, 0, 16, 0]).fill(0xa8834e)
    .moveTo(0, -56).lineTo(0, -62).stroke({ width: 2, color: 0x6b5a48, cap: 'round' }));
  const tentDoor = new Graphics().poly([-13, 0, 0, -38, 13, 0]).fill(0xffffff);
  tentC.addChild(tentDoor, new Graphics().poly([-13, 0, 0, -38, -4, -22, -20, 0]).fill(0xe0c08a));
  const tentGlow = addSprite(actors, glowTex, { add: true, tint: 0xffb060 });

  const campC = new Container();
  campC.addChild(new Graphics()
    .ellipse(0, 1, 26, 3).fill({ color: 0x000000, alpha: 0.22 })
    .roundRect(-18, -22, 32, 22, 5).fill(0x6a4a32)
    .rect(-12, -18, 2, 14).fill(0x57391f).rect(2, -16, 2, 12).fill(0x57391f)
    .ellipse(-2, -22, 16, 3.5).fill(0xa98559)
    .ellipse(-2, -22, 9, 2).stroke({ width: 1, color: 0x7a5a3d })
    .rect(-60, -10, 8, 10).fill(0x3c3631).rect(-59, -13, 6, 3).fill(0x3c3631));
  // The pack he walks with, set down upright beside the stump: the worn shape, shifted so it stands on
  // the ground left of the stump, opened, its bedroll taken into the tent for the night.
  const campPack = new Graphics();
  drawPack(campPack, (x, y) => [x - 21, y + 6.2], { open: true });
  campC.addChild(campPack);
  const lanternGlow = addSprite(actors, glowTex, { add: true, tint: 0xffc070 });
  const lanternFlame = new Graphics().roundRect(-58.5, -9, 5, 7, 1.5).fill(0xffffff);
  campC.addChild(lanternFlame);

  const fireC = new Container();
  const fireBase = new Graphics()
    .ellipse(0, 1, 22, 3.5).fill({ color: 0x000000, alpha: 0.3 })
    .poly([-16, -1, 13, -9, 15, -5, -14, 3]).fill(0x4a3324)
    .poly([16, -1, -13, -9, -15, -5, 14, 3]).fill(0x3f2b1f)
    .ellipse(-19, -2, 5.5, 4).fill(0x6b6660).ellipse(19, -2, 5.5, 4).fill(0x6b6660)
    .ellipse(-11, 1, 5, 3.5).fill(0x5e5953).ellipse(11, 1, 5, 3.5).fill(0x5e5953).ellipse(0, 2, 5, 3).fill(0x66615a);
  const flames = new Graphics();
  const tripod = new Graphics()
    .moveTo(-26, 2).lineTo(0, -66).stroke({ width: 2.4, color: 0x5a4330, cap: 'round' })
    .moveTo(24, 2).lineTo(0, -66).stroke({ width: 2.4, color: 0x5a4330, cap: 'round' })
    .moveTo(0, -66).lineTo(0, -46).stroke({ width: 1.2, color: 0x2a2724 })
    .ellipse(0, -37, 10, 8).fill(0x2f2c2a).ellipse(0, -44.5, 6.5, 2).fill(0x403c39)
    .poly([8, -40, 15, -45, 16, -43, 9, -36]).fill(0x2f2c2a)
    .ellipse(-3, -39, 3, 3.5).fill({ color: 0xffffff, alpha: 0.08 });
  fireC.addChild(fireBase, flames, tripod);
  const fireGlow = addSprite(actors, glowTex, { add: true, tint: 0xff8a40 });
  const fireCore = addSprite(actors, glowTex, { add: true, tint: 0xffb060 });

  const grassG = new Graphics();
  // Hoarfrost: the upper half of every blade and a rime crust on the ground, drawn over the green grass.
  const frostG = new Graphics();
  const flowerG = new Graphics();
  const smokeC = new Container();
  const steamC = new Container();
  const sparksC = new Container();
  const fliesC = new Container();
  actors.addChild(grassG, frostG, flowerG, tentC, campC, pebbleG, trav, catC, birdG, fireC, smokeC, steamC, sparksC, fliesC);
  actors.setChildIndex(tentGlow, actors.children.length - 1);
  actors.setChildIndex(lanternGlow, actors.children.length - 1);
  actors.setChildIndex(fireGlow, actors.children.length - 1);
  actors.setChildIndex(fireCore, actors.children.length - 1);

  const pool = (parent, n, tex, opts) => Array.from({ length: n }, () => {
    const s = addSprite(parent, tex, opts); s.visible = false;
    return { s, life: 0, max: 1, x: 0, y: 0, vx: 0, vy: 0 };
  });
  const sparks = pool(sparksC, 30, dotTex, { add: true, tint: 0xffb060 });
  const smoke = pool(smokeC, 16, puffTex, {});
  const steam = pool(steamC, 10, puffTex, { tint: 0xffffff });
  const flies = Array.from({ length: 24 }, () => ({
    s: addSprite(fliesC, dotTex, { add: true, tint: 0xd8ff8a }),
    bx: Math.random(), by: 0.72 + Math.random() * 0.22, ph: Math.random() * 6.28, f: 0.4 + Math.random() * 0.8,
  }));

  function drawFlames(t, k, wind) {
    flames.clear();
    if (k < 0.01) return;
    flames.ellipse(0, -1, 15, 4.5).fill({ color: 0xff5a1f, alpha: 0.9 });
    const tongues = [[-7, 0.75, 0], [6, 0.8, 1.3], [0, 1, 2.1], [-3, 0.6, 3.3], [4, 0.55, 4.4]];
    for (const [col, sc] of [[0xd8432a, 1], [0xff8c38, 0.72], [0xffd27a, 0.45], [0xfff2c4, 0.22]]) {
      for (const [ox, hs, ph] of tongues) {
        const h = (38 * hs + Math.sin(t * 11 + ph * 2) * 5 + Math.sin(t * 6.3 + ph) * 3) * sc * k;
        if (h < 2) continue;
        const w = (9 * sc + 2) * (0.7 + 0.3 * k), x0 = ox * sc;
        const sway = Math.sin(t * 4.7 + ph) * 3 * sc - wind * 2 * sc;
        flames.moveTo(x0 - w, 0)
          .bezierCurveTo(x0 - w, -h * 0.45, x0 + sway - w * 0.3, -h * 0.72, x0 + sway, -h)
          .bezierCurveTo(x0 + sway + w * 0.3, -h * 0.72, x0 + w, -h * 0.45, x0 + w, 0)
          .closePath().fill(col);
      }
    }
  }

  function drawGrass(t, wind) {
    grassG.clear(); flowerG.clear(); frostG.clear();
    const frost = state.weather.frost;
    const L = env.ground;
    if (!L || !L.grass) return;
    const G = L.grass, F = L.flowers, uOff = layerOffset(L);
    const k0 = Math.floor((uOff - 0.02) / G.spacing), k1 = Math.ceil((uOff + W / S + 0.02) / G.spacing);
    for (let k = k0; k <= k1; k++) {
      if (hash(k, L.seed + 71) > G.density) continue;
      const u = (k + hash(k, L.seed + 73)) * G.spacing;
      const sx = (u - uOff) * S, y = yAt(L, sx, uOff) + H * 0.002;
      const h = lerp(G.h[0], G.h[1], hash(k, L.seed + 79)) * H;
      const sw = (Math.sin(t * 1.7 + u * 23) * 0.6 + Math.sin(t * 0.6 + u * 5) * 0.4) * wind;
      const blades = 2 + Math.floor(hash(k, L.seed + 83) * 3);
      for (let b = 0; b < blades; b++) {
        const off = (b - (blades - 1) / 2) * h * 0.18;
        const hb = h * (0.6 + 0.4 * hash(k * 7 + b, L.seed + 85));
        const w = hb * 0.07 + 0.7;
        const tx = sx + off * 1.9 + sw * hb * 0.22;
        grassG.poly([sx + off - w, y, sx + off + w, y, tx, y - hb]).fill(0xffffff);
        if (frost) {
          // Rime grows on the blade from the tip down, thicker than the blade itself, so it reads as a crust.
          const a = 0.55, lx = lerp(sx + off - w, tx, a), rx = lerp(sx + off + w, tx, a), ya = y - hb * a;
          frostG.poly([lx - 0.3, ya, rx + 0.3, ya, tx, y - hb - 0.3]).fill({ color: 0xffffff, alpha: 0.55 });
        }
      }
      if (frost) {
        // A white crust along the ground between the tufts, with a few crystals catching the light.
        const gap = G.spacing * S;
        frostG.roundRect(sx - gap * 0.6, y - H * 0.0025, gap * 1.2, H * 0.003, H * 0.0015).fill({ color: 0xffffff, alpha: 0.4 });
        if (hash(k, L.seed + 91) < 0.35) frostG.circle(sx + (hash(k, L.seed + 93) - 0.5) * gap, y - H * 0.004, Math.max(0.8, H * 0.0016)).fill(0xffffff);
      }
      // Nothing blooms in a frost.
      if (!frost && F && hash(k, L.seed + 87) < F.density) {
        const col = F.colors[Math.floor(hash(k, L.seed + 89) * F.colors.length)];
        flowerG.circle(sx + sw * h * 0.22, y - h, Math.max(1.4, h * 0.09)).fill(col);
      }
    }
  }

  function drawBirds(t, P, color) {
    birdsG.clear();
    if (P.bright < 0.6) return;
    const p = (t % 48) / 32;
    if (p >= 1) return;
    const fx = lerp(-0.15 * W, 1.15 * W, p), fy = H * (0.2 + Math.sin(p * 3) * 0.03);
    const s = H * 0.0065;
    for (let i = 0; i < 5; i++) {
      const x = fx - Math.abs(i - 2) * s * 4.5, y = fy + (i - 2) * s * 2.6;
      const f = Math.sin(t * 8 + i * 1.3) * 0.7;
      birdsG.moveTo(x - s, y - s * f).lineTo(x, y).lineTo(x + s, y - s * f);
    }
    birdsG.stroke({ width: color ? 1.8 : 1.4, color: color ? mix(mul(color, P.light, P.bright), P.haze, 0.2) : mix(0x2a2e36, P.haze, 0.35), cap: 'round', join: 'round' });
  }

  const shooting = { next: 6, t0: -1, x: 0, y: 0, dx: 0, dy: 0 };
  function drawShootingStar(t, starsK) {
    shootG.clear();
    if (starsK < 0.6) return;
    if (shooting.t0 < 0 && t > shooting.next) {
      shooting.t0 = t; shooting.x = W * (0.2 + Math.random() * 0.6); shooting.y = H * (0.05 + Math.random() * 0.2);
      const a = 0.35 + Math.random() * 0.4, sp = H * 0.9;
      shooting.dx = Math.cos(a) * sp * (Math.random() < 0.5 ? -1 : 1); shooting.dy = Math.sin(a) * sp;
    }
    if (shooting.t0 < 0) return;
    const age = t - shooting.t0;
    if (age > 0.9) { shooting.t0 = -1; shooting.next = t + 8 + Math.random() * 14; return; }
    const x = shooting.x + shooting.dx * age, y = shooting.y + shooting.dy * age;
    const a = Math.sin(Math.PI * age / 0.9) * starsK;
    shootG.moveTo(x, y).lineTo(x - shooting.dx * 0.12, y - shooting.dy * 0.12).stroke({ width: 1.5, color: 0xffffff, alpha: a * 0.8, cap: 'round' });
    shootG.circle(x, y, 1.6).fill({ color: 0xffffff, alpha: a });
  }

  function stepParticles(list, dt, spawn, update) {
    for (const p of list) {
      if (p.life <= 0) {
        if (spawn(p)) p.s.visible = true;
        else { p.s.visible = false; continue; }
      }
      p.life -= dt;
      update(p, 1 - clamp(p.life / p.max));
    }
  }

  // ---------- layout ----------
  // An upright phone shows the stage in this proportion (850 by 520 units): wide enough for the wanderer,
  // the cat, the camp and the path ahead where pebbles lie, which a full-height stage cut down to the
  // phone's narrow width left out. Most of the spare height becomes sky, the rest ground below him.
  const UPRIGHT_STAGE = 850 / 520;
  const UPRIGHT_SKY_SHARE = 0.6;
  function layout() {
    const screenW = app.screen.width, screenH = app.screen.height;
    laidOutW = screenW; laidOutH = screenH;
    W = screenW; H = screenH > screenW ? Math.min(screenH, Math.round(screenW * UPRIGHT_STAGE)) : screenH;
    ABOVE = Math.round((screenH - H) * UPRIGHT_SKY_SHARE); BELOW = screenH - H - ABOVE;
    app.stage.y = ABOVE;
    S = H; MARGIN = W * 0.6;
    unit = H / 850;
    sky.width = W; sky.height = H;
    skyAbove.visible = ABOVE > 0; skyAbove.position.set(0, -ABOVE - 1); skyAbove.width = W; skyAbove.height = ABOVE + 2;
    milky.position.set(W * 0.5, H * 0.3); milky.width = Math.hypot(W, H) * 1.1; milky.height = H * 0.22; milky.rotation = Math.atan2(H * 0.32, W);
    buildStars();
    for (const c of [trav, fireC, campC]) c.scale.set(unit);
    catC.scale.set(unit * CAT_SCALE);
    // A real two-person tent stands taller than the traveller sitting next to it.
    tentC.scale.set(unit * TENT_SCALE);
    moon.scale.set(H * 0.022 / 50);
    moonGlow.width = moonGlow.height = 50 * 9;
    if (env) { buildClouds(env.def); layoutEnvironment(); }
  }

  // ---------- weather ----------
  // How much a sky hides the sun and greys the light, from 0 (clear) to about 1.
  const SKY_COVER = { clear: 0, partly: 0.18, overcast: 0.85, fog: 0.8 };
  const WIND_STRENGTH = { calm: 0.35, breeze: 1, strong: 2.2 };
  const SNOW_FLAKES = { snow: 110, heavySnow: 260 };
  const grey = (c) => { const [r, g, b] = rgb(c); const l = r * 0.3 + g * 0.59 + b * 0.11; return hex([l, l, l]); };
  const cover = () => SKY_COVER[state.weather.sky] + (state.weather.storm ? 0.15 : 0) + (state.weather.precipitation !== 'none' ? 0.08 : 0);
  /** The time of day's palette under today's sky: a heavy sky greys and dims it and hides the stars. */
  function weatherPalette(P) {
    const g = clamp(cover());
    if (g <= 0) return P;
    const toGrey = (c, k) => mix(c, grey(c), k);
    return {
      ...P,
      top: toGrey(P.top, g * 0.75), hor: toGrey(P.hor, g * 0.6), haze: toGrey(P.haze, g * 0.6),
      // Rain grey is multiplied into the hour's own cloud colour, so a heavy sky darkens at night with it.
      light: toGrey(P.light, g * 0.7),
      cloud: mix(toGrey(P.cloud, g * 0.6), mul(grey(P.cloud), 0x9aa0a8), cloudGrey(state.weather)),
      bright: P.bright * (1 - 0.3 * g), stars: P.stars * (1 - g),
    };
  }
  // Rain streaks or snowflakes, each on its own fixed track so the fall is steady, not random each frame.
  function drawPrecipitation(t, P, windK) {
    precipG.clear();
    const kind = state.weather.precipitation;
    if (kind === 'none') return;
    const snow = kind === 'snow' || kind === 'heavySnow';
    const rain = rainLook(kind);
    const count = snow ? SNOW_FLAKES[kind] : rain.count;
    const light = mul(0xffffff, P.light, Math.max(P.bright, 0.5));
    const slant = (snow ? 0.15 : 0.12) * windK;
    for (let i = 0; i < count; i++) {
      const speed = H * (snow ? 0.06 + hash(i, 902) * 0.06 : 0.9 + hash(i, 902) * 0.5);
      const span = ABOVE + H + BELOW + 60;
      const y = mod(hash(i, 901) * span + t * speed, span) - 30 - ABOVE;
      const x = mod(hash(i, 900) * W + y * slant + (snow ? Math.sin(t * 0.8 + i) * H * 0.01 : 0), W);
      if (snow) {
        precipG.circle(x, y, (1 + hash(i, 903) * 1.6) * (H / 850)).fill({ color: light, alpha: 0.85 });
      } else {
        const len = H * rain.length;
        precipG.moveTo(x, y).lineTo(x - len * slant, y - len);
      }
    }
    // All raindrops share one stroke: hundreds of separate strokes a frame cost a phone too much in a downpour.
    if (rain) precipG.stroke({ width: Math.max(1, H / 900) * rain.width, color: light, alpha: rain.alpha });
  }
  // A gust: what the wind lifts here (tumbling leaves, dust on the Meseta, sand by the Baltic, flakes in
  // snow) blows low over the ground from beyond the left edge to beyond the right, each bit going once
  // round a little loop on the way, as wind is drawn in a cartoon. For players who ask for less motion a
  // gust is slower and its bits fly straight.
  const GUST_LOOP_SHARE = 0.5;
  const GUST_DEBRIS_COLORS = {
    leaves: [0x8a6a3a, 0xa3803f, 0x6f6a38], dust: [0xcdb894, 0xb9a27c], sand: [0xd9c9a0, 0xc8b68a], snow: [0xf4f6fa],
  };

  // A bit's track runs straight, goes once round a loop and runs on straight. The loop is drawn by hand,
  // not with compasses: a little wider or taller than round (`squash`), and its edge swells and narrows
  // once on the way round (`wobble`).
  function gustTrack(u, loop) {
    const { at, r, drift, squash, wobble, phase } = loop;
    const round = Math.PI * 2 * r;
    if (u < at) return [u, 0];
    if (u >= at + round) return [u - round + drift, 0];
    const a = (u - at) / r;
    // Zero where the loop meets the straight track at both ends, so the path never kinks there.
    const swell = 1 + wobble * Math.sin(a / 2) * Math.sin(a / 2 + phase);
    return [at + r * (1 + squash) * swell * Math.sin(a) + (drift * a) / (Math.PI * 2), -r * (1 - squash) * swell * (1 - Math.cos(a))];
  }
  // Where along its track a bit is at `p` (0 to 1 of the gust). `stages` are lengths of track with
  // the time each unit of length takes; a stage marked `linger` is run with a pause in the middle: the
  // bit eases off as it nears the top of the loop, hangs there for a moment at about two fifths of its
  // speed, and picks up again, all without a jolt. Elsewhere it keeps an even pace.
  const GUST_LINGER = 0.6;
  // The share of a lingering stage covered once `x` of its time has passed; its speed dips to
  // 1 - GUST_LINGER halfway.
  const linger = (x) => x - (GUST_LINGER * Math.sin(Math.PI * 2 * x)) / (Math.PI * 2);
  function gustPlace(p, start, stages) {
    const total = stages.reduce((sum, [len, pace]) => sum + len * pace, 0);
    let time = p * total, u = start;
    for (const [len, pace, kind] of stages) {
      // A bit without a loop has a loop stage of no length; skip it rather than divide 0 by 0.
      if (len <= 0) continue;
      if (time <= len * pace) return u + (kind === 'linger' ? len * linger(time / (len * pace)) : time / pace);
      time -= len * pace; u += len;
    }
    return u;
  }
  function drawGusts(t, P, groundY) {
    gustG.clear();
    // GUST_SECONDS is the crossing of a 16:9 screen. The scene is scaled to the screen's height, so a
    // narrower screen is crossed sooner and the bits keep the same speed through the scene: on an upright
    // phone a gust would otherwise crawl. Not below 0.45 of it, so a loop still reads.
    const across = clamp(W / H / (16 / 9), 0.45, 1);
    const gust = gustAt(t, state.weather.wind, GUST_SECONDS * across * (calmMotion ? 1.8 : 1));
    if (!gust) return;
    const { progress: p, strength: k, seed } = gust;
    const dim = Math.max(P.bright, 0.3);
    const debris = gustDebris(state.biome, state.weather.precipitation);
    const colors = GUST_DEBRIS_COLORS[debris];
    const count = Math.round((debris === 'leaves' ? 12 : 20) * k);
    // The loops drift on with the wind meanwhile, so a bit never stalls while it goes round.
    const carry = W * 0.22;
    for (let i = 0; i < count; i++) {
      const r = (salt) => hash(i, seed * 17 + salt);
      // About half the bits go round a loop; the rest fly flat. Reduced motion: none loop.
      const loops = !calmMotion && r(11) < GUST_LOOP_SHARE;
      const radius = loops ? Math.min(W, H) * (0.015 + r(7) * 0.02) : 0;
      const round = Math.PI * 2 * radius;
      const loop = {
        at: W * (0.48 + (r(8) - 0.5) * 0.4) - carry * 0.4,
        r: radius, drift: radius * 1.4, squash: (r(9) - 0.4) * 0.35, wobble: 0.1, phase: r(10) * 6.28,
      };
      // Starts beyond the left edge and ends beyond the right: nothing fades in or out on screen.
      const start = -0.1 * W - r(1) * W * 0.3, end = 1.25 * W + round - loop.drift - carry;
      const u = gustPlace(p, start, [
        [Math.max(0, loop.at - start), 0.85],
        [round, 2.6, 'linger'],
        [Math.max(0, end - (loop.at + round)), 1],
      ]);
      const [tx, ty] = gustTrack(u, loop);
      const x = tx + carry * p;
      // Low over the ground wherever it is, rising and dipping with the land: most bits skim it, fewer fly a
      // little higher. A loop lifts its bit above that.
      const above = H * (0.008 + Math.pow(r(2), 1.6) * 0.11);
      const y = groundY(x) - above + ty + Math.sin(t * 3 + i) * H * 0.006;
      const spin = t * (4 + r(5) * 3) + r(6) * 6.28;
      const color = mul(colors[i % colors.length], P.light, dim);
      if (debris === 'leaves') {
        // A leaf tumbles: a small flat rhombus turning as it flies.
        const a = spin * 1.4, len = H * 0.006, wide = H * 0.0024;
        const [ca, sa] = [Math.cos(a), Math.sin(a)];
        gustG.poly([x + ca * len, y + sa * len, x - sa * wide, y + ca * wide, x - ca * len, y - sa * len, x + sa * wide, y - ca * wide])
          .fill({ color, alpha: k * 0.9 });
      } else {
        gustG.circle(x, y, H * (debris === 'snow' ? 0.0024 : 0.0016)).fill({ color, alpha: k * (debris === 'snow' ? 0.85 : 0.5) });
      }
    }
  }
  // Lightning: now and then, at a moment picked per stretch of the clock, a double flash that fades.
  // Flashes are left out for players who ask for less motion; the storm still darkens the sky.
  const calmMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function lightning(t) {
    if (!state.weather.storm || calmMotion) return 0;
    const stretch = Math.floor(t / 11), at = 2 + hash(stretch, 904) * 7, x = t - stretch * 11 - at;
    if (x < 0 || x > 1) return 0;
    return Math.exp(-x * 9) + 0.6 * Math.exp(-Math.max(0, x - 0.18) * 12) * (x > 0.18 ? 1 : 0);
  }

  // ---------- frame ----------
  // Whether the tent stands, the stump and props are out, and he is asleep in the tent, by the hour.
  // Each switches at one moment; the fade between states is timed on the animation clock (see
  // `approachLevels`), because at the real speed of the day a fade spread over game minutes would leave
  // him and the camp half transparent for half an hour.
  // When the camp stands and the stump is out, by the hour and today's walk (see campSchedule.ts).
  function campTarget(h) { return tentUp(h, state.walk) ? 1 : 0; }
  function seatTarget(h) { return seatOut(h, state.walk) ? 1 : 0; }
  function sleepTarget(h) { return h >= 23.2 || h < 5 ? 1 : 0; }
  const LEVEL_FADE_S = 1.4;
  const campLevels = { camp: null, seat: null, sleep: null };
  function approachLevels(h, dt) {
    const step = dt / LEVEL_FADE_S;
    for (const [key, target] of [['camp', campTarget(h)], ['seat', seatTarget(h)], ['sleep', sleepTarget(h)]]) {
      const v = campLevels[key];
      campLevels[key] = v === null ? target : v + clamp(target - v, -step, step);
    }
    return { camp: smooth(0, 1, campLevels.camp), seat: smooth(0, 1, campLevels.seat), sleep: smooth(0, 1, campLevels.sleep) };
  }
  function statusOf(h, walking, sleep) {
    if (walking) return 'walking';
    if (h >= pitchHour(state.walk) && h < pitchHour(state.walk) + 1) return 'pitchingCamp';
    if (sleep > 0.5) return 'sleeping';
    if (state.walk && h >= state.walk.startHour - leadOf(state.walk) && h < state.walk.startHour) return 'packingUp';
    return 'resting';
  }

  const dragging = false;
  // The cat's place relative to the wanderer, in his units: behind him on the road, past the fire at camp.
  const CAT_FOLLOW_X = -56, CAT_CAMP_X = 102;
  // `noRideUntil`: after being sent down, the cat stays off the backpack for the rest of that ride.
  const cat = { x: null, phase: 0, pendingDown: false, downStart: -Infinity, noRideUntil: -Infinity };
  // How far he has gone into his gale posture, 0 to 1; it eases in and out over about a second.
  let galeK = 0;
  // What can be started at this moment, refreshed every frame and reported in the snapshot.
  const available = new Set();
  // Behaviours a developer can trigger from the dev panel. Each normally runs on its own loop of the
  // animation clock; a trigger starts it now, and `forcedAge` gives the seconds since that trigger.
  const BEHAVIOURS = [
    { id: 'pipe', group: 'wanderer' }, { id: 'grass', group: 'wanderer', biomes: ['meseta', 'forest', 'fields', 'lakes'] },
    { id: 'view', group: 'wanderer' }, { id: 'drink', group: 'wanderer' }, { id: 'strap', group: 'wanderer' },
    { id: 'hat', group: 'wanderer' }, { id: 'pebble', group: 'wanderer' },
    { id: 'campPipe', group: 'camp' }, { id: 'campTea', group: 'camp' },
    { id: 'catRide', group: 'cat' }, { id: 'catDown', group: 'cat' }, { id: 'catWash', group: 'cat' },
    ...BIRD_IDS.map((id) => ({ id, group: 'bird' })), { id: 'shootingStar', group: 'world' },
    { id: 'ship', group: 'world' }, { id: 'fishingBoat', group: 'world' }, { id: 'angler', group: 'world' },
    { id: 'sailboat', group: 'world' }, { id: 'swans', group: 'world' }, { id: 'shop', group: 'world', biomes: ['fields'] },
    { id: 'jetty', group: 'world', biomes: ['lakes'] },
    { id: 'bigfoot', group: 'world' },
  ];
  const forced = {};
  let forcedBirdSpecies = 0;
  const forcedAge = (id) => (forced[id] === undefined ? Infinity : state.t - forced[id]);
  const forcedWindow = (id, length) => {
    const x = forcedAge(id);
    return x === Infinity ? 0 : smooth(0, 0.5, x) * (1 - smooth(length - 0.5, length, x));
  };
  // How long a pipe or a mug of tea started from the developer panel lasts by the fire, in seconds.
  const CAMP_PIPE_S = 14, CAMP_TEA_S = 6;
  let hudTimer = 0, lastSkyHour = -1;
  let stretchStartT = null;

  function frame(tk) {
    if (app.screen.width !== laidOutW || app.screen.height !== laidOutH) layout();
    const dt = Math.min(0.05, tk.deltaMS / 1000);
    state.t += dt;
    const t = state.t;
    if (state.auto && !dragging) {
      state.hour += dt * 24 / state.dayLength;
      if (state.hour >= 24) { state.hour -= 24; state.day++; }
    }
    const h = state.hour;
    const walk = state.walk;
    const walking = !state.still && !!walk && h >= walk.startHour && h < walk.endHour;
    // Now and then on the road he stops for a few seconds to take in the view, and some stretches he
    // walks with his pipe in his teeth. Both are fixed loops of the animation clock.
    const viewPause = walking ? Math.max(smooth(0, 0.8, mod(t, 80) - 52) * (1 - smooth(0, 0.8, mod(t, 80) - 59.5)), forcedWindow('view', 7.5)) : 0;
    const grassForced = forcedAge('grass') < 24;
    const walkPipe = walking && !grassForced && ((mod(t, 45) > 15 && mod(t, 45) < 38) || forcedAge('pipe') < 23);
    // window(period, start, length): 0..1 envelope of a gesture that repeats every `period` seconds.
    const window = (period, start, length) => {
      const x = mod(t, period) - start;
      return smooth(0, 0.5, x) * (1 - smooth(length - 0.5, length, x));
    };
    // He drinks twice as often around midday and on the hot Meseta.
    const thirsty = (h > 11 && h < 16) || state.biome === 'meseta';
    available.clear();
    const drink = walking ? Math.max(window(70, 33, 3.2), thirsty ? window(70, 8, 3.2) : 0, forcedWindow('drink', 3.2)) : 0;
    const strap = walking ? Math.max(window(64, 20, 2.4), forcedWindow('strap', 2.4)) : 0;
    const hatFix = walking ? Math.max(window(97, 40, 1.8), forcedWindow('hat', 1.8)) : 0;
    const grassStalk = walking && !walkPipe && BEHAVIOURS.find((b) => b.id === 'grass').biomes.includes(state.biome) && ((mod(t, 50) > 22 && mod(t, 50) < 46) || grassForced);
    // Morning: while the camp is packed up he stands, and as he gets up he stretches once with a yawn.
    // The stretch lasts a few real seconds whatever the clock speed, so it's timed on the animation clock.
    const lead = walk ? leadOf(walk) : 0;
    const morningStand = !walking && !state.still && !!walk && h >= walk.startHour - lead && h < walk.startHour;
    if (morningStand && stretchStartT === null) stretchStartT = t;
    if (!morningStand) stretchStartT = null;
    const stretch = stretchStartT === null ? 0 : smooth(0, 0.6, t - stretchStartT) * (1 - smooth(3.6, 4.4, t - stretchStartT));
    // After the stretch he packs up, bent over and busy with his hands, until about 07:00, then waits ready.
    const packedAt = walk ? walk.startHour - lead / 3 : 0;
    const packing = morningStand && h < packedAt ? smooth(0, 0.6, t - (stretchStartT ?? t) - 4.4) * (1 - smooth(packedAt - lead / 12, packedAt, h)) : 0;
    state.speed += ((walking ? 1 - viewPause : 0) - state.speed) * Math.min(1, dt * 2.2);
    if (!walking && state.speed < 0.003) state.speed = 0;
    state.offsetU += state.speed * dt * WALK_U_PER_S;
    galeK += ((state.weather.wind === 'strong' ? 1 : 0) - galeK) * Math.min(1, dt * 1.2);
    state.phase += Math.sqrt(state.speed) * dt * Math.PI * 2 / (CYCLE_S * galeStride(galeK));
    const windK = WIND_STRENGTH[state.weather.wind];
    const wind = (0.6 + 0.4 * Math.sin(t * 0.13) * Math.sin(t * 0.31 + 1)) * windK;

    if (walking) {
      for (const id of ['drink', 'strap', 'hat']) available.add(id);
      if (!walkPipe && !grassStalk) available.add('pipe');
      if (!grassStalk && BEHAVIOURS.find((b) => b.id === 'grass').biomes.includes(state.biome)) available.add('grass');
      if (viewPause < 0.01) available.add('view');
      if (!pebbles.some((pb) => pb.age < 0)) available.add('pebble');
    }
    const P = weatherPalette(paletteAt(h));
    const def = env.def;
    if (Math.abs(h - lastSkyHour) > 0.004) { paintSky(P); lastSkyHour = h; }
    skyAbove.tint = P.top;

    // Sky.
    starsC.visible = P.stars > 0.01;
    if (starsC.visible) {
      starsC.alpha = P.stars;
      for (const st of stars) st.s.alpha = st.base * (0.65 + 0.35 * Math.sin(t * st.f + st.ph));
    }
    milky.alpha = 0.13 * P.stars;
    drawShootingStar(t, P.stars);
    if (P.stars >= 0.6 && shooting.t0 < 0) available.add('shootingStar');
    if (state.biome === 'fields' && !state.allShops) available.add('shop');
    if (env.layers.some((L) => L.jetties)) available.add('jetty');

    const sp = (h - 5.6) / (20.4 - 5.6);
    const sunUp = sp > 0 && sp < 1;
    const sunX = lerp(W * 0.08, W * 0.92, clamp(sp)), sunY = H * 0.62 - Math.sin(clamp(sp) * Math.PI) * H * 0.5;
    const lowness = sunUp ? 1 - Math.sin(sp * Math.PI) : 1;
    sunDisc.visible = sunGlow.visible = sunHalo.visible = sunVeil.visible = sunUp;
    if (sunUp) {
      sunDisc.position.set(sunX, sunY); sunDisc.scale.set(H * 0.026 / 50); sunDisc.tint = mix(0xfff6e0, 0xffa25e, lowness * 0.9);
      sunGlow.position.set(sunX, sunY); sunGlow.width = sunGlow.height = H * lerp(0.26, 0.55, lowness);
      sunGlow.tint = mix(0xfff2d8, P.light, 0.6); sunGlow.alpha = 0.7;
      sunHalo.position.set(sunX, sunY); sunHalo.width = sunHalo.height = H * lerp(0.9, 1.9, lowness);
      sunHalo.tint = mix(P.light, P.hor, 0.4); sunHalo.alpha = lerp(0.1, 0.38, lowness);
      sunVeil.position.set(sunX, sunY); sunVeil.width = sunVeil.height = H * 2.4;
      sunVeil.tint = P.light; sunVeil.alpha = lowness * lowness * 0.16;
    }
    const mp = mod(h - 19.8, 24) / 11;
    moon.visible = mp < 1;
    if (moon.visible) {
      moon.position.set(lerp(W * 0.18, W * 0.85, mp), H * 0.6 - Math.sin(mp * Math.PI) * H * 0.46);
      moon.alpha = clamp((0.95 - P.bright) / 0.55);
      moonGlow.alpha = 0.35;
    }

    // A light source hidden behind the terrain must not light ridges, cast rays or reflect in the lake.
    // Visibility fades over about one disc diameter so the sun dims as it sinks behind a peak.
    const skylineAt = x => { let y = H; for (const L of env.layers) y = Math.min(y, yAt(L, x, layerOffset(L))); return y; };
    const visibility = (x, y, r) => clamp((skylineAt(x) - y) / (r * 2) + 0.5);
    // A heavy sky hides the sun and moon: no disc, no glow, no rays, no light on the ridges.
    const clearSky = 1 - clamp(cover());
    // The sun's glow, halo and veil and the moon get their alpha anew every frame they show (above), so
    // dimming them here never builds up; the disc has no alpha of its own, so it is set outright.
    sunDisc.alpha = clearSky;
    if (sunUp) for (const o of [sunGlow, sunHalo, sunVeil]) o.alpha *= clearSky;
    if (moon.visible) moon.alpha *= clearSky;
    const sunVis = sunUp ? visibility(sunX, sunY, H * 0.026) * clearSky : 0;
    const moonVis = moon.visible ? visibility(moon.x, moon.y, H * 0.022) * moon.alpha : 0;
    sunVeil.alpha *= sunVis;
    const shadowCol = mix(mul(P.haze, 0xffffff, 0.55), 0x2b2f66, 0.35);
    const lightX = sunUp ? sunX : moon.visible ? moon.x : W / 2;
    const rawSide = clamp((lightX - W * 0.5) / (W * 0.32), -1, 1);
    const sk = (rawSide >= 0 ? 1 : -1) * Math.max(Math.abs(rawSide), 0.4);
    const shadeAmt = (sunUp ? lerp(0.3, 0.55, lowness) : 0.22) * lerp(0.45, 1, Math.max(sunVis, moonVis));
    const litAmt = (sunUp ? lerp(0.08, 0.3, lowness) : 0.03) * Math.max(sunVis, moonVis);
    const coolMul = mix(0x6670a8, P.haze, 0.3);
    const sideTint = (col, s) => s < 0 ? mix(col, mul(col, coolMul), -s * shadeAmt * 1.2) : mix(col, mul(col, P.light, 1.3), s * litAmt);
    const nightK = clamp((0.75 - P.bright) / 0.45);
    const dark = 1 - clamp(P.bright);

    const cloudGreyK = cloudGrey(state.weather);
    for (const c of clouds) {
      const span = W + c.cw * 2;
      c.c.x = mod(c.base * span + t * c.speed * windK * (S / 900) - state.offsetU * S * 0.02, span) - c.cw * 0.5;
      c.body.tint = P.cloud;
      c.shade.tint = mix(P.cloud, shadowCol, 0.42);
      // Under a grey deck the sun lights no cloud tops.
      c.hi.tint = mix(P.cloud, mul(0xffffff, P.light, 1.15), 0.5 * (1 - nightK * 0.7) * (1 - cloudGreyK * 0.85));
    }
    drawBirds(t, P, def.birdColor);

    // Landscape.
    const mist = clamp(smooth(4.5, 6.2, h) * (1 - smooth(7.6, 10, h)) + (state.weather.sky === 'fog' ? 1 : 0));
    const fogMul = (0.3 + 0.9 * mist) * def.mist;
    const fogColor = mix(P.haze, 0xffffff, 0.12 + mist * 0.15);
    // In fog, and less so in heavy rain, the land itself sinks into the haze, the far most but the near too.
    const fogK = landFog(state.weather);
    const colorAt = (c, depth) =>
      mix(mul(c, P.light, P.bright), P.haze, Math.min(0.92, Math.pow(depth, 1.5) * 0.85 + 0.03 + fogK * 0.5 * (0.35 + 0.65 * depth)));
    for (const L of env.layers) {
      placeLayer(L);
      const col = colorAt(L.color, L.depth);
      L.g.tint = col;
      if (L.shL) { L.shL.tint = sideTint(col, -sk); L.shR.tint = sideTint(col, sk); }
      if (L.faces) L.gully.tint = mix(col, shadowCol, 0.75);
      if (L.sgL) {
        const sc = mix(mul(0xf4f8ff, P.light, Math.max(P.bright, 0.45) * 1.05), P.haze, clamp(L.depth * 0.3));
        L.sgL.tint = sideTint(sc, -sk * 1.3); L.sgR.tint = sideTint(sc, sk * 1.3);
      }
      if (state.weather.frost && L.depth < 0.8) {
        // Frost greys the open ground nearby; far off it is lost in the haze.
        L.g.tint = mix(col, mul(0xdde6ee, P.light, Math.max(P.bright, 0.45)), 0.35 * (1 - L.depth / 0.8));
      }
      if (L.pathG) { const pc = colorAt(L.path, L.depth); L.pathG.tint = pc; L.gully.tint = mix(pc, col, 0.6); }
      if (L.rowG) L.rowG.tint = mix(col, mul(col, P.light, 1.3), 0.25);
      if (L.tL) { const tc = L.trees && L.trees.color ? colorAt(L.trees.color, L.depth) : mul(col, 0xffffff, 0.93); L.tL.tint = sideTint(tc, -sk); L.tR.tint = sideTint(tc, sk); }
      if (L.bark) {
        // Birch bark is white with black marks; a coastal pine's trunk is rust-orange.
        const barkColor = L.trees.type === 'coastpine' ? 0x7f5442 : 0xe8e4da;
        L.bark.tint = sideTint(colorAt(barkColor, L.depth), sk * 0.5); L.barkMarks.tint = colorAt(0x2e2a28, L.depth);
      }
      if (L.walls) {
        const B = L.cabins || L.village || L.boats || L.lighthouse || L.fence || { wall: 0xeee6d2, roof: 0xb24a30 };
        const wc = colorAt(B.wall, L.depth), rc = colorAt(B.roof, L.depth);
        L.walls.tint = sideTint(wc, sk * 0.6); L.planks.tint = mix(wc, mul(wc, coolMul), 0.45); L.roofs.tint = sideTint(rc, -sk * 0.4);
        L.win.tint = mix(mul(wc, 0xffffff, 0.45), 0xffc46b, nightK);
      }
      if (L.wet) L.wet.tint = mul(col, 0xb8ad9c);
      if (L.jettyDeck) {
        // Old planks darkened by the weather, like the beams under them.
        L.jettyDeck.tint = sideTint(colorAt(0x564130, L.depth), sk * 0.4);
        L.jettyPosts.tint = L.jettySeams.tint = colorAt(0x2c2119, L.depth);
        L.jettyBoat.tint = colorAt(0x7a5236, L.depth); L.jettyBoatRim.tint = colorAt(0x4a3020, L.depth);
        // The moored boat is the angler's: while he is out fishing it is gone from the jetty.
        const out = !!env.ships?.angler?.visible;
        L.jettyBoat.visible = L.jettyBoatRim.visible = !out;
      }
      if (L.patches) L.patchwork.colors.forEach((c, n) => { L.patches[n].tint = colorAt(c, L.depth); });
      // A Ropucha shop in view, at any hour: the easiest moment in the world to witness.
      if (L.shops && !ropuchaReported) {
        const shop = L.shops.find((it) => { const x = (it.u - layerOffset(L)) * S; return x > 0 && x < W; });
        if (shop) { ropuchaReported = true; options.onWorldEvent?.({ id: 'ropuchaSeen', forced: !shop.natural }); }
      }
      if (L.neon) {
        // The neon reads green by day and burns brighter after dusk, with a halo round it.
        L.neon.tint = mix(colorAt(0x2f8f4e, L.depth), 0x58f07e, nightK * 0.85);
        L.neonGlow.tint = 0x4cf07a; L.neonGlow.alpha = 0.06 + 0.5 * nightK;
        L.shopTexts.tint = mix(colorAt(0xe6f2e2, L.depth), 0xf2fff4, nightK);
      }
      if (L.church) L.church.tint = sideTint(colorAt(L.village?.church ?? 0xa54c33, L.depth), sk * 0.6);
      if (L.wood) {
        L.wood.tint = sideTint(colorAt(0x6e4b30, L.depth), sk * 0.4);
        L.woodLines.tint = colorAt(0x4a3220, L.depth);
        L.stork.tint = colorAt(0xf2efe8, L.depth);
        L.storkDark.tint = colorAt(0x26262a, L.depth);
        L.storkRed.tint = colorAt(0xc8432e, L.depth);
      }
      if (L.tractor) {
        L.tractor.tint = sideTint(colorAt(0xb8382a, L.depth), sk * 0.4);
        L.tractorDark.tint = colorAt(0x2c2a28, L.depth);
        L.tractorHub.tint = colorAt(0xc9a456, L.depth);
      }
      if (L.bales) {
        L.bales.tint = sideTint(colorAt(0xc9a456, L.depth), sk * 0.4);
        L.balesShade.tint = colorAt(0x9a7a3c, L.depth);
      }
      if (L.lhRed) { L.lhRed.tint = sideTint(colorAt(L.lighthouse.wall, L.depth), sk * 0.5); L.lhWhite.tint = sideTint(colorAt(0xf1ede4, L.depth), sk * 0.5); }
      if (L.rimG) { L.rimG.tint = P.light; L.rimG.alpha = lowness * lowness * 0.3 * sunVis; }
      if (L.rg) L.rg.tint = mul(col, 0xc2cad2);
      if (L.fogS) { L.fogS.tint = fogColor; L.fogS.alpha = clamp(L.fog * fogMul * (0.25 + 0.75 * L.depth + 0.4 * fogK), 0, 0.75 + 0.15 * fogK); }
    }
    // On a portrait phone the screen is too narrow for corner framing; it would cover the camp.
    if (env.overlay) front.visible = W > H;
    if (env.overlay && front.visible) { placeLayer(env.overlay); env.overlay.g.tint = mix(mul(env.overlay.color, P.light, P.bright), P.haze, 0.06); }

    for (const m of env.mists) {
      for (const it of m.items) {
        const w = it.w * W, span = W + w;
        it.s.position.set(mod(it.base * span + t * it.speed * (H / 900), span) - w / 2, it.y * H);
        it.s.width = w; it.s.height = it.h * H;
        it.s.tint = fogColor;
        it.s.alpha = clamp((0.06 + 0.55 * mist + 0.25 * fogK) * def.mist * it.a, 0, 0.7 + 0.15 * fogK);
      }
    }

    const lk = env.lake;
    if (lk) {
      const Ly = env.lakeY;
      const water = def.water || {};
      lk.skyR.tint = water.tint || 0xb4c0ca;
      lk.body.tint = colorAt(water.body || 0x2c5a68, 0.75); lk.body.alpha = water.bodyAlpha || 0;
      lk.sheen.tint = mix(P.hor, 0xffffff, 0.2); lk.sheen.alpha = 0.35;
      lk.shore.tint = mix(P.hor, 0xffffff, 0.4); lk.shore.alpha = 0.45;
      const src = sunVis > 0.01 ? { x: sunX, c: P.light, a: 0.55 * (0.4 + 0.6 * lowness) * sunVis }
        : moonVis > 0.01 ? { x: moon.x, c: 0xc8d2ff, a: 0.3 * moonVis } : null;
      lk.streak.visible = !!src;
      if (src) {
        lk.streak.position.set(src.x, Ly + H * 0.1); lk.streak.width = H * 0.07; lk.streak.height = H * 0.34;
        lk.streak.tint = src.c; lk.streak.alpha = src.a;
      }
      lk.shimmer.clear();
      const shCol = mix(P.hor, 0xffffff, 0.35);
      for (let i = 0; i < (water.shimmer || 46); i++) {
        const y = Ly + (0.006 + Math.pow(hash(i, 5), 1.4) * 0.12) * H;
        const x = mod(hash(i, 7) * W + t * (4 + hash(i, 8) * 10), W + 60) - 30;
        const w = (0.008 + hash(i, 9) * 0.035) * S;
        const a = (0.1 + 0.3 * Math.pow(Math.sin(t * (0.8 + hash(i, 10) * 1.5) + i), 2)) * clamp(P.bright + 0.25);
        lk.shimmer.rect(x, y, w, 1.2).fill({ color: shCol, alpha: a });
      }
    }

    if (env.ships) {
      const foul = state.weather.storm || state.weather.precipitation === 'snow' || state.weather.precipitation === 'heavySnow';
      fairK += ((foul ? 0 : 1) - fairK) * Math.min(1, dt * 0.8);
      for (const kind of Object.keys(env.ships)) {
        const sh = SHIPS[kind], g = env.ships[kind];
        const pass = shipPass(kind, t, forcedAge(sh.id));
        // Daylight-only vessels slip away as the light goes rather than vanishing.
        const becalmed = sh.windy && state.weather.wind === 'calm';
        g.alpha = (sh.daytime ? 1 - smooth(0.3, 0.45, dark) : 1) * (sh.fairWeather ? fairK : 1) * (becalmed ? 0 : 1);
        g.visible = !!pass && g.alpha > 0.01;
        if (!g.visible) { if ((!sh.daytime || dark < 0.3) && (!sh.fairWeather || fairK > 0.5) && !becalmed) available.add(sh.id); continue; }
        const len = sh.len * H, sc = len / 100;
        let x = lerp(-len, W + len, pass.dir > 0 ? pass.k : 1 - pass.k);
        if (sh.anchored) {
          // Its spot on the lake is fixed when the visit begins, mostly on the right so that a walking
          // wanderer passes it; from then on it moves only as the lake does.
          const visit = Math.round((t - pass.k * sh.cross) / 10);
          if (anchors[kind]?.visit !== visit) {
            const startX = W * (0.45 + 0.45 * hash(visit, sh.seed + 2));
            anchors[kind] = { visit, u: startX / S + state.offsetU * LAKE_SPEED };
          }
          x = (anchors[kind].u - state.offsetU * LAKE_SPEED) * S;
          g.alpha *= smooth(0, 0.05, pass.k) * (1 - smooth(0.95, 1, pass.k));
        }
        const col = (c) => colorAt(c, sh.depth);
        if (kind === 'cargo') drawCargoShip(g, col, nightK);
        else if (kind === 'angler') drawAngler(g, col, t, forcedAge(sh.id) < sh.cross ? forcedAge(sh.id) : Infinity);
        else if (kind === 'sailboat') drawSailboat(g, col, t, WIND_STRENGTH[state.weather.wind]);
        else if (kind === 'swans') drawSwans(g, col, t);
        else drawCutter(g, col, nightK, t);
        const rock = kind === 'cargo' ? 0.15 : kind === 'swans' ? 0.3 : 1;
        g.position.set(x, env.lakeY + sh.y * H + Math.sin(t * 1.3) * 0.6 * rock);
        g.scale.set(sc * pass.dir, sc);
        g.rotation = Math.sin(t * 1.1) * 0.03 * rock * pass.dir;
      }
    }

    if (env.bigfoot) {
      const bf = env.bigfoot, pass = bigfootPass(t, forcedAge('bigfoot'));
      // The grey hour around sunrise and around dusk; at any other time there is no Bigfoot at all.
      const halfLight = Math.max(window4(h, 4.9, 5.3, 6.3, 6.8), window4(h, 19.6, 20, 20.9, 21.3));
      bf.g.visible = !!pass && halfLight > 0.01;
      if (!bf.g.visible && halfLight > 0.5) available.add('bigfoot');
      if (bf.g.visible) {
        // It steps out somewhere in the middle of the view, drawn once per sighting.
        if (bigfootAt?.visit !== pass.visit) {
          const startX = W * (0.25 + 0.5 * hash(pass.visit, BIGFOOT.seed + 2));
          bigfootAt = { visit: pass.visit, u: startX / S + layerOffset(bf.L), reported: false };
        }
        const x = (bigfootAt.u - pass.age * BIGFOOT.speedU - layerOffset(bf.L)) * S;
        const sc = (BIGFOOT.height * H) / 40;
        // A shade lighter than the wood behind it, like a figure in the mist, not a hole in the trees.
        drawBigfoot(bf.g, mix(0x7c7e88, P.haze, 0.45), t * 4.2);
        // Out from behind one trunk and, a few seconds later, behind another.
        const k = pass.age / pass.length;
        bf.g.alpha = 0.85 * halfLight * smooth(0, 0.15, k) * (1 - smooth(0.8, 1, k));
        // Once it has plainly been in view, the player has seen it.
        if (!bigfootAt.reported && bf.g.alpha > 0.5) {
          bigfootAt.reported = true;
          options.onWorldEvent?.({ id: 'bigfootSeen', forced: pass.forced });
        }
        bf.g.position.set(x, yAt(bf.L, x, layerOffset(bf.L)) + 1);
        bf.g.scale.set(-sc, sc);
      }
    }

    // Surf: a bright foam line that washes up and down the wet sand, and a broken second line further out.
    if (env.foam) {
      const Bl = env.beach, bo = layerOffset(Bl), fg = env.foam;
      fg.clear();
      const swash = Math.sin(t * 0.55) * 0.5 + 0.5;
      const step = Math.max(4, W / 220);
      fg.moveTo(0, yAt(Bl, 0, bo));
      for (let x = 0; x <= W + step; x += step) fg.lineTo(x, yAt(Bl, x, bo) - 1 - swash * H * 0.004 + Math.sin(x * 0.03 + t * 1.3) * H * 0.0008);
      fg.stroke({ width: Math.max(1.5, H * 0.0028), color: 0xffffff, alpha: 0.65 * (0.5 + 0.5 * swash) });
      for (let x = 0; x <= W; x += step * 3) {
        if (noise1(x * 0.01 + t * 0.15, 9) < 0.45) continue;
        const y = yAt(Bl, x, bo) - H * (0.009 + 0.004 * (1 - swash));
        fg.moveTo(x, y).lineTo(x + step * 2.2, y + Math.sin(x) * 0.5);
      }
      fg.stroke({ width: Math.max(1, H * 0.0016), color: 0xffffff, alpha: 0.35 });
      fg.tint = mix(mul(0xffffff, P.light, Math.max(P.bright, 0.35)), P.haze, 0.25);
    }
    // Lighthouse at night: the lamp turns full circle. Side-on we see the beam swing left and right;
    // when it swings toward the viewer it shortens to a point and the lamp flares, briefly dazzling.
    if (env.beam) {
      const Lh = env.lightL, lo = layerOffset(Lh);
      const lamp = (Lh.lights || []).map(l => ({ x: (l.u - lo) * S, y: yAt(Lh, (l.u - lo) * S, lo) + 2 - l.lampDy })).find(l => l.x > -W * 0.3 && l.x < W * 1.3);
      const on = !!lamp && nightK > 0.05;
      env.beam.visible = env.glare.visible = env.flash.visible = on;
      if (on) {
        const th = t * 0.7, side = Math.cos(th), toward = Math.sin(th);
        const facing = Math.pow(Math.max(0, toward), 10);
        env.beam.position.set(lamp.x, lamp.y);
        env.beam.width = Math.max(4, Math.abs(side) * W * 0.7); env.beam.height = H * 0.13;
        env.beam.scale.x = Math.abs(env.beam.scale.x) * (side < 0 ? -1 : 1);
        env.beam.alpha = nightK * (0.2 + 0.45 * Math.abs(side)) * (toward < 0 ? 0.6 : 1);
        env.glare.position.set(lamp.x, lamp.y);
        env.glare.width = env.glare.height = H * (0.03 + 0.35 * facing);
        env.glare.alpha = nightK * (0.5 + 0.5 * facing);
        env.flash.position.set(lamp.x, lamp.y);
        env.flash.width = env.flash.height = Math.hypot(W, H) * 2;
        env.flash.alpha = nightK * 0.22 * facing;
        // Dazzled: the beam full in the face on a dark night, with the lamp in view.
        if (facing > 0.9 && nightK > 0.5 && lamp.x > 0 && lamp.x < W) options.onWorldEvent?.({ id: 'lighthouseGlare', forced: false });
      }
    }

    const rayK = def.rays * Math.pow(lowness, 1.2) * (0.5 + mist) * sunVis;
    const baseAngle = Math.atan2(H * 0.95 - sunY, W * 0.5 - sunX);
    for (const r of rays) {
      r.s.visible = rayK > 0.01;
      if (!r.s.visible) continue;
      r.s.position.set(sunX, sunY);
      r.s.rotation = baseAngle + r.a + Math.sin(t * 0.15 + r.k * 5) * 0.025;
      r.s.width = Math.hypot(W, H) * 1.2; r.s.height = H * r.w;
      r.s.tint = P.light; r.s.alpha = rayK * 0.07 * r.k;
    }

    // Traveller and camp.
    const G = env.ground, gOff = layerOffset(G);
    const groundY = x => yAt(G, x, gOff) + 2;
    const tx = W * (W > H ? 0.44 : 0.6), ty = groundY(tx);
    const { camp, seat, sleep } = approachLevels(h, dt);
    // The fire is lit for the evening and the night only, even when he stays at camp all day.
    const daytime = smooth(7, 7.3, h) * (1 - smooth(19.1, 19.4, h));
    const fireK = camp * (1 - 0.6 * sleep) * (1 - daytime);
    const flick = 0.85 + 0.15 * Math.sin(t * 17) * Math.sin(t * 6.1);
    const amb = mix(mul(0xffffff, P.light, clamp(P.bright * 1.05, 0.16, 1.1)), P.haze, 0.08);
    const charTint = mix(amb, 0xffb987, fireK * dark * 0.8);

    // Now and then a pebble lies on the path ahead. As it comes within reach he draws his leg back
    // and kicks it hard and straight: it flies low and far ahead, bounces twice, rolls and stops. Each
    // pebble is good for one to three kicks, drawn when it appears: while kicks are left, he kicks it again
    // when he catches up with it, and after the last one he walks past it. Distances, heights and speeds are in his units (850 to the screen height);
    // the toe cap of the swung boot meets the pebble's near side at 41.
    pebbleG.clear();
    let kick = 0, kickBack = 0;
    const PEBBLE_G = 900, PEBBLE_KICK = { vx: 520, vy: 150 };
    const PEBBLE_EVERY_S = 60, PEBBLE_FIRST_S = 30, PEBBLE_CHANCE = 0.55;
    const pebbleWaiting = pebbles.some((pb) => pb.age < 0);
    // About every other minute, at a moment drawn per minute, never in the first half minute of the walk:
    // like the other habits it comes when it comes, not the moment he sets off.
    const pebbleMinute = Math.floor(t / PEBBLE_EVERY_S);
    const pebbleAt = pebbleMinute * PEBBLE_EVERY_S + PEBBLE_FIRST_S + hash(pebbleMinute, 911) * (PEBBLE_EVERY_S - PEBBLE_FIRST_S);
    const pebbleDue = hash(pebbleMinute, 912) < PEBBLE_CHANCE && t >= pebbleAt && t - dt < pebbleAt;
    if (walking && !pebbleWaiting && (pebbleDue || forcedAge('pebble') < dt * 1.5)) {
      pebbles.push({ u: gOff + (tx + 150 * unit) / S, h: 0, vx: 0, vy: 0, age: -1, kicksLeft: 1 + Math.floor(Math.random() * 3) });
    }
    for (const pb of pebbles) {
      let px = (pb.u - gOff) * S;
      const d = (px - tx) / unit;
      if (pb.age < 0 && d < 41) { pb.age = 0; pb.vx = PEBBLE_KICK.vx; pb.vy = PEBBLE_KICK.vy; pb.kicksLeft--; }
      if (pb.age >= 0) {
        pb.age += dt;
        pb.vy -= PEBBLE_G * dt;
        pb.h += pb.vy * dt;
        if (pb.h <= 0) {
          pb.h = 0;
          // Each landing keeps a third of the bounce and loses some speed; once the bounce is tiny it rolls.
          pb.vy = pb.vy < -40 ? -pb.vy * 0.35 : 0;
          pb.vx *= pb.vy > 0 ? 0.6 : Math.exp(-dt * 5);
        }
        pb.u += pb.vx * dt / 850;
        px = (pb.u - gOff) * S;
        // Follow-through: the leg stays up a moment after the strike, then drops back into the stride.
        kick = Math.max(kick, 1 - smooth(0.1, 0.4, pb.age));
        // Come to rest ahead of him with a kick left: it waits for the next one.
        if (pb.kicksLeft > 0 && pb.h === 0 && pb.vx < 8 && (pb.u - gOff) * S - tx > 60 * unit) { pb.age = -1; pb.vx = 0; }
      } else {
        // Wind-up from 72 to 52, then the snap forward over the last few units before the strike. Both fade
        // when he stops (to take in the view), so he never stands still with his leg drawn back.
        const moving = smooth(0.3, 0.8, state.speed);
        const strike = (1 - smooth(41, 50, d)) * moving;
        kick = Math.max(kick, strike);
        kickBack = Math.max(kickBack, (1 - smooth(54, 72, d)) * (1 - strike) * moving);
      }
      const py = groundY(px) - (3.6 + pb.h) * unit;
      // A stone about the size of his boot's toe cap, darker than the path specks and lit on top, so it
      // reads on a phone and doesn't vanish among them.
      pebbleG.ellipse(px, py, 6.4 * unit, 4.2 * unit).fill(0x5c5853);
      pebbleG.ellipse(px - 1.2 * unit, py - 1.6 * unit, 3.8 * unit, 1.8 * unit).fill(0x9a948c);
      pb.x = px;
    }
    pebbleG.tint = charTint;
    pebbles = pebbles.filter((pb) => pb.x > -20);

    const sitting = !walking && state.speed < 0.04 && !morningStand;
    trav.position.set(tx, ty);
    trav.tint = charTint;
    trav.alpha = 1 - sleep;
    let mugPos = null, puff = 0, exhaling = false;
    if (sitting) {
      // From the developer panel: a pipe now, for one session, or the mug now, with a sip straight away.
      const pipeNow = forcedWindow('campPipe', CAMP_PIPE_S);
      const teaNow = forcedWindow('campTea', CAMP_TEA_S);
      const teaAge = forcedAge('campTea');
      const sipNow = smooth(0.6, 0.85, teaAge) * (1 - smooth(2.8, 3.05, teaAge));
      const sipK = Math.max(smooth(0, 0.25, mod(t, 15) - 11) * (1 - smooth(0, 0.25, mod(t, 15) - 13.2)), sipNow);
      const lookK = smooth(0.55, 0.8, noise1(t * 0.05, 77));
      // By the fire he picks his pipe or a mug of tea at random for each stretch of time (see `firesidePipe`);
      // the developer panel can start either at once. Every 6 s he draws on the pipe for about two
      // seconds, then lowers it and breathes the smoke out.
      const pipeK = lerp(firesidePipe(t), 1, pipeNow) * (1 - teaNow);
      const pc = mod(t, 6);
      puff = smooth(0, 0.6, pc) * (1 - smooth(2, 2.6, pc));
      exhaling = pipeK > 0.5 && pc > 2.4 && pc < 3.6;
      const hand = drawSitter(travG, t, pipeK, puff, sipK, lookK, wind, def.sprig);
      mugPos = pipeK < 0.5 ? hand : null;
      if (sleep < 0.5) {
        if (pipeNow === 0) available.add('campPipe');
        if (teaNow === 0) available.add('campTea');
      }
    } else {
      drawWalker(travG, state.phase, state.speed, t, wind, def.sprig, {
        pipe: walkPipe, grass: grassStalk, lookUp: viewPause, drink, strap, hat: hatFix, stretch, packing, kickBack, kick, gale: galeK,
      });
    }

    const tentX = tx - 160 * unit, fireX = tx + 52 * unit, fireY = groundY(fireX);
    tentC.visible = camp > 0.01; tentC.alpha = camp; tentC.tint = charTint;
    tentC.position.set(tentX, groundY(tentX) + 1);
    tentDoor.tint = mix(0x2f2219, 0xffc27a, sleep * dark * 0.9);
    tentGlow.visible = tentC.visible;
    tentGlow.position.set(tentX, tentC.y - 16 * TENT_SCALE * unit);
    tentGlow.width = tentGlow.height = H * 0.22; tentGlow.alpha = camp * sleep * dark * 0.6;

    campC.visible = seat > 0.01; campC.alpha = seat; campC.tint = charTint;

    birdG.clear();
    let birdPos = null;
    {
      const tentTop = [tentX, tentC.y - 62 * TENT_SCALE * unit];
      const atCamp = camp > 0.5;
      const perch = atCamp ? tentTop : [tx + packTop[0] * unit, ty + packTop[1] * unit];
      const birdForced = forcedAge('bird') < 33;
      const cyc = birdForced ? forcedAge('bird') + 6 : mod(t, 46), bs = unit * 0.9;
      // A visit is one of the rarer events: only about one 46-second cycle in six brings a bird, and each
      // visit picks its own species. Birds don't fly at night, so at camp they come only in the evening
      // light or at dawn.
      const visit = Math.floor(t / 46);
      // While the cat rides on the backpack, no bird lands there.
      const visiting = dark < 0.4 && (birdForced || (hash(visit, 77) < 0.17 && (atCamp || !catRideOverlaps(visit * 46 + 6, visit * 46 + 39))));
      const speciesIndex = birdForced ? forcedBirdSpecies : Math.floor(hash(visit, 78) * BIRD_SPECIES.length);
      const species = BIRD_SPECIES[speciesIndex];
      let pos = null, flying = false, face = 1;
      if (visiting && cyc >= 11 && cyc < 34) {
        const hp = mod(cyc - 11, 4);
        pos = [perch[0], perch[1] - (hp < 0.3 ? Math.sin(hp / 0.3 * Math.PI) * 3 * unit : 0)];
        face = noise1(cyc * 0.3, 5) > 0.5 ? 1 : -1;
        // Perched in view on his pack or the tent: the player has had this species visit.
        const visitKey = birdForced ? `forced${forced.bird}` : visit;
        if (birdReported !== visitKey && pos[0] > 0 && pos[0] < W) {
          birdReported = visitKey;
          options.onWorldEvent?.({ id: `bird:${BIRD_KEYS[speciesIndex]}`, forced: birdForced });
        }
      } else if (visiting && cyc >= 7 && cyc < 11) {
        // Arrives from beyond the left edge and leaves past the right edge, so it never pops in or out on screen.
        const from = [-W * 0.08, perch[1] - H * 0.4];
        pos = qbez(from, [lerp(from[0], perch[0], 0.6), perch[1] - H * 0.38], perch, smooth(0, 1, (cyc - 7) / 4));
        flying = cyc < 10.8;
      } else if (visiting && cyc >= 34 && cyc < 38) {
        const to = [W * 1.08, perch[1] - H * 0.4];
        pos = qbez(perch, [lerp(perch[0], to[0], 0.35), perch[1] - H * 0.04], to, Math.pow((cyc - 34) / 4, 1.4));
        flying = cyc > 34.2;
        face = 1;
      }
      if (pos) drawBird(birdG, pos[0], pos[1], bs, face, flying, t * 26, species);
      birdPos = pos;
      birdG.tint = charTint;
    }
    {
      // The cat follows a little behind the wanderer. Now and then it sits down to wash a paw, falls
      // behind, then trots to catch up. On some stretches it rides on his backpack, leaping up and down.
      // In the evening it sleeps curled on the far side of the fire, facing it. When he turns in, it
      // walks to the tent and goes in with him; at dawn it comes out with him, sits by the fire and
      // does its own stretch with his. Its place is kept relative to him, in his units.
      const groundSpeed = state.speed * WALK_U_PER_S * S / unit;
      const atCamp = camp > 0.5 || seat > 0.3;
      const rideForced = forcedAge('catRide') < CAT_RIDE.to - CAT_RIDE.from;
      const rc = rideForced ? CAT_RIDE.from + forcedAge('catRide') : mod(t, CAT_RIDE.period);
      const washLength = CAT_WASH.to - CAT_WASH.from;
      const washForced = forcedAge('catWash') < washLength;
      const brk = washForced ? CAT_WASH.from + forcedAge('catWash') : mod(t, CAT_WASH.period);
      // A wash that would fall during a ride is skipped; otherwise the cat would drop from the backpack
      // without a leap to wash on the road, and pop back up when it is done.
      const onBreak = walking && !rideForced && brk > CAT_WASH.from && brk < CAT_WASH.to && (washForced || !catWashSkipped(t));
      let riding = walking && !onBreak && !birdPos && rc >= CAT_RIDE.from && rc < CAT_RIDE.to && t >= cat.noRideUntil;
      let rcShown = rc;
      if (cat.pendingDown) {
        cat.pendingDown = false;
        if (riding) { cat.noRideUntil = t + (CAT_RIDE.to - rc); cat.downStart = t; delete forced.catRide; }
      }
      // Sent down: replay the end of a ride, the leap from the backpack to the ground.
      if (walking && t - cat.downStart < CAT_RIDE.leap) { riding = true; rcShown = CAT_RIDE.to - CAT_RIDE.leap + (t - cat.downStart); }
      const tentRelX = (tentX - tx) / unit;
      const inTent = atCamp && sleepTarget(h) === 1;
      const target = inTent ? tentRelX : atCamp ? CAT_CAMP_X : CAT_FOLLOW_X;
      if (cat.x === null) cat.x = target;
      let rel = 0;
      if (riding) cat.x = CAT_FOLLOW_X;
      else if (onBreak) rel = -groundSpeed;
      else rel = clamp((target - cat.x) * 3, -55, 55);
      cat.x += rel * dt;
      const speed = (walking ? groundSpeed : 0) + rel;
      cat.phase += dt * speed / 12 * Math.PI * 2;
      const moving = Math.abs(speed) > 2;
      let face = speed < -2 ? -1 : speed > 2 ? 1 : atCamp ? -1 : 1;
      let pose = moving ? (Math.abs(rel) > 12 ? 'trot' : 'walk')
        : atCamp ? (stretch > 0.15 ? 'stretch' : seat > 0.3 && h >= 12 ? 'curl' : 'sit')
        : onBreak && brk > 32 && brk < 35.5 ? 'wash' : 'sit';
      const gx = tx + cat.x * unit;
      let pos = [gx, groundY(gx)];
      if (riding) {
        const perch = [tx + (packTop[0] + 1) * unit, ty + (packTop[1] + 2) * unit];
        const up = clamp((rcShown - CAT_RIDE.from) / CAT_RIDE.leap), down = clamp((rcShown - (CAT_RIDE.to - CAT_RIDE.leap)) / CAT_RIDE.leap);
        const k = down > 0 ? 1 - down : up;
        const mid = [lerp(pos[0], perch[0], 0.5), perch[1] - 10 * unit];
        pos = k >= 1 ? perch : qbez(pos, mid, perch, smooth(0, 1, k));
        pose = k >= 1 ? 'loaf' : 'leap';
        if (k >= 1) available.add('catDown');
        face = 1;
      }
      // It turns its head to the bird whenever one is near.
      let look = [0, 0];
      if (birdPos) {
        const dx = birdPos[0] - pos[0], dy = pos[1] - birdPos[1], d = Math.hypot(dx, dy) || 1;
        look = [clamp(dx / d * face, -1, 1), clamp(dy / d, -1, 1)];
      }
      // Curled by the fire it dozes off now and then; while its eyes are open it blinks every few seconds.
      const shut = pose === 'curl' ? sleep > 0.2 || mod(t, 23) > 14 || mod(t, 5.3) < 0.16 : pose === 'wash' || mod(t, 4.7) < 0.14;
      if (walking && !riding && !birdPos) available.add('catRide');
      if (walking && !riding && !onBreak) available.add('catWash');
      if (dark < 0.4 && !birdPos && !riding) for (const id of BIRD_IDS) available.add(id);
      const wear = catWear(state.weather);
      drawCat(catG, catEyeG, pose, face, cat.phase, { look, shut, t, coat: wear.coat, cape: wear.cape });
      catC.position.set(pos[0], pos[1]);
      // It fades out as it slips through the tent door and fades in as it comes back out.
      catC.alpha = camp > 0.01 ? smooth(4, 24, Math.abs(cat.x - tentRelX)) : 1;
      catC.visible = catC.alpha > 0.01;
      catG.tint = charTint;
      // Yellow eyes catch the firelight in the evening.
      catEyeG.tint = mix(charTint, 0xffffff, clamp(fireK * dark * 0.9 + (1 - dark) * 0.6));
    }
    campC.position.set(tx, ty);
    lanternFlame.tint = mix(0x3c3631, 0xffd27a, dark);
    lanternGlow.visible = campC.visible;
    lanternGlow.position.set(tx - 56 * unit, ty - 6 * unit);
    lanternGlow.width = lanternGlow.height = H * 0.07; lanternGlow.alpha = seat * dark * (1 - sleep) * 0.5 * flick;

    fireC.visible = camp > 0.01; fireC.alpha = camp; fireC.position.set(fireX, fireY);
    fireBase.tint = charTint; tripod.tint = charTint;
    drawFlames(t, fireK, wind);
    fireGlow.visible = fireCore.visible = fireC.visible;
    fireGlow.position.set(fireX, fireY - H * 0.02); fireGlow.width = H * 0.8; fireGlow.height = H * 0.45;
    fireGlow.alpha = fireK * (0.22 + 0.3 * dark) * flick;
    fireCore.position.set(fireX, fireY - H * 0.018); fireCore.width = fireCore.height = H * 0.12;
    fireCore.alpha = fireK * 0.55 * flick;

    stepParticles(sparks, dt, p => {
      if (fireK < 0.2 || Math.random() > dt * 14 * fireK) return false;
      p.life = p.max = 0.8 + Math.random() * 1.2;
      p.x = fireX + (Math.random() - 0.5) * H * 0.012; p.y = fireY - H * 0.02;
      p.vx = (Math.random() - 0.5) * H * 0.02; p.vy = -H * (0.05 + Math.random() * 0.05);
      return true;
    }, (p, age) => {
      p.x += (p.vx + Math.sin(t * 3 + p.max * 9) * H * 0.01 - wind * H * 0.01) * dt; p.y += p.vy * dt;
      p.s.position.set(p.x, p.y); p.s.width = p.s.height = H * 0.006; p.s.alpha = 1 - age;
    });
    const smokeTint = mix(mul(0x9a9aa0, P.light, Math.max(P.bright, 0.3)), P.haze, 0.3);
    stepParticles(smoke, dt, p => {
      if (fireK < 0.2 || Math.random() > dt * 2.5 * fireK) return false;
      p.life = p.max = 4 + Math.random() * 2.5;
      p.x = fireX + (Math.random() - 0.5) * H * 0.01; p.y = fireY - 70 * unit;
      return true;
    }, (p, age) => {
      p.x -= wind * H * 0.014 * dt; p.y -= H * 0.022 * dt * (1 - age * 0.4);
      p.s.position.set(p.x + Math.sin(t * 0.8 + p.max * 3) * H * 0.006, p.y);
      p.s.width = p.s.height = H * (0.02 + 0.07 * age);
      p.s.tint = smokeTint; p.s.alpha = 0.2 * smooth(0, 0.12, age) * (1 - age) * fireK;
    });
    // Steam from the mug, or pipe smoke: a thin wisp from the bowl and a breath of smoke from the mouth.
    stepParticles(steam, dt, p => {
      if (sleep > 0.3) return false;
      if (mugPos && Math.random() < dt * 2.2) {
        p.x = tx + mugPos[0] * unit; p.y = ty + (mugPos[1] - 7) * unit; p.s.tint = 0xffffff;
      } else if (pipeAt && exhaling && Math.random() < dt * 7) {
        p.x = tx + (pipeAt.mouth[0] + 2) * unit; p.y = ty + pipeAt.mouth[1] * unit; p.s.tint = 0xd6d9de;
      } else if (pipeAt && Math.random() < dt * (0.8 + 3 * puff)) {
        p.x = tx + pipeAt.bowl[0] * unit; p.y = ty + (pipeAt.bowl[1] - 3) * unit; p.s.tint = 0xc4c8ce;
      } else return false;
      p.life = p.max = 1.6 + Math.random();
      return true;
    }, (p, age) => {
      p.x -= wind * H * 0.004 * dt; p.y -= H * 0.012 * dt;
      p.s.position.set(p.x + Math.sin(t * 2 + p.max * 5) * H * 0.002, p.y);
      p.s.width = p.s.height = H * (0.006 + 0.014 * age);
      p.s.alpha = 0.35 * smooth(0, 0.15, age) * (1 - age);
    });

    const flyK = clamp(P.stars * 1.2) * def.fireflies;
    fliesC.visible = flyK > 0.01;
    if (fliesC.visible) {
      for (const f of flies) {
        const x = mod(f.bx * W + Math.sin(t * f.f * 0.5 + f.ph) * H * 0.04 - state.offsetU * S * 0.5, W);
        const y = f.by * H + Math.sin(t * f.f + f.ph * 2) * H * 0.02;
        f.s.position.set(x, y); f.s.width = f.s.height = H * 0.009;
        f.s.alpha = flyK * Math.pow(0.5 + 0.5 * Math.sin(t * f.f * 2.2 + f.ph), 3);
      }
    }

    drawGrass(t, wind);
    grassG.tint = mix(colorAt(G.color, G.depth), mul(0xffffff, P.light, P.bright * 0.8), G.grass ? G.grass.light : 0.25);
    // Hoarfrost is a cold blue-white that takes the light of the hour, never brighter than snow on the ridges.
    frostG.tint = mix(mul(0xeef4ff, P.light, Math.max(P.bright, 0.45) * 1.05), P.haze, 0.08);
    if (state.weather.frost) grassG.tint = mix(grassG.tint, 0x8a9a8c, 0.25);
    drawGusts(t, P, groundY);
    drawPrecipitation(t, P, windK);
    const bolt = lightning(t);
    flash.visible = bolt > 0.01;
    if (flash.visible) { flash.position.set(0, -ABOVE); flash.width = W; flash.height = ABOVE + H + BELOW; flash.tint = 0xdfe6ff; flash.alpha = bolt * 0.32; }
    flowerG.tint = charTint;

    if (state.hideWanderer) {
      for (const o of [trav, catC, tentC, tentGlow, campC, lanternGlow, fireC, fireGlow, fireCore, smokeC, steamC, sparksC]) o.visible = false;
      birdG.clear();
    }

    hudTimer -= dt;
    if (hudTimer <= 0) {
      hudTimer = 0.2;
      options.onSnapshot?.({ hour: h, day: state.day, km: 214 + state.offsetU * KM_PER_U, status: statusOf(h, walking, sleep), biome: state.biome, level: state.level, auto: state.auto, behaviours: BEHAVIOURS.filter((b) => available.has(b.id)).map(({ id, group }) => ({ id, group })) });
    }
  }

  state.speed = !state.still && state.walk && state.hour >= state.walk.startHour && state.hour < state.walk.endHour ? 1 : 0;
  layout();
  buildEnvironment();
  app.ticker.add(frame);

  return {
    biomeIds: Object.keys(BIOMES),
    setHour(hour) { state.hour = mod(hour, 24); lastSkyHour = -1; },
    setAuto(on) { state.auto = on; },
    setBeard(length) { state.beard = clamp(length); },
    setDayLength(seconds) { state.dayLength = seconds; },
    setWalk(walk) { state.walk = walk; },
    setWeather(weather) {
      const skyChanged = weather.sky !== state.weather.sky;
      state.weather = weather;
      lastSkyHour = -1;
      if (skyChanged && env) buildClouds(env.def);
    },
    setBiome(id) { if (BIOMES[id] && id !== state.biome) { state.biome = id; state.allShops = false; buildEnvironment(); } },
    levelsOf(id) { return LEVELED_BIOMES.includes(id) ? Object.keys(LEVELS) : ['mid']; },
    setLevel(level) { if (LEVELS[level] && level !== state.level) { state.level = level; buildEnvironment(); } },
    reseed() { state.seed += 1; state.allShops = false; buildEnvironment(); },
    // The landscape of a place on the route, set in one go so the scene is rebuilt once.
    setLandscape({ biome, level, seed }) {
      if (!BIOMES[biome]) return;
      if (biome === state.biome && level === state.level && seed === state.seed) return;
      state.biome = biome; if (LEVELS[level]) state.level = level; state.seed = seed; state.allShops = false;
      buildEnvironment();
    },
    trigger(id) {
      if (!BEHAVIOURS.some((b) => b.id === id)) return;
      if (id === 'shootingStar') { shooting.next = state.t; return; }
      // The corner shop: every village in view gets one, until the scene moves to another place.
      if (id === 'shop') { state.allShops = true; buildEnvironment(); return; }
      // A jetty a little left of the middle of the view, so it runs out across it.
      if (id === 'jetty') {
        for (const L of env.layers) if (L.jetties) { L.forcedJettyU = layerOffset(L) + (W * 0.4) / S; L.u0 = -1e9; }
        return;
      }
      if (id === 'catDown') { cat.pendingDown = true; return; }
      if (BIRD_IDS.includes(id)) { forcedBirdSpecies = BIRD_IDS.indexOf(id); forced.bird = state.t; return; }
      forced[id] = state.t;
    },
    destroy() {
      app.destroy(true, { children: true });
      overlays.forEach((d) => d.remove());
    },
  };
}
