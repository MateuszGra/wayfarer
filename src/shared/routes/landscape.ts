import { BIOME_LEVELS, type BiomeId, type ElevationLevel } from '../biomes.js';

/** One biome a region can show, how often against the others, and at which heights. */
export interface BiomeShare {
  readonly biome: BiomeId;
  readonly weight: number;
  /** Allowed levels; left out, every level the biome has. */
  readonly levels?: readonly ElevationLevel[];
}

/** A stretch of a route and the mix of landscapes it shows. */
export interface Region {
  readonly id: string;
  readonly fromKm: number;
  readonly toKm: number;
  readonly mix: readonly BiomeShare[];
}

/** What the scene shows at a place on the route. */
export interface Landscape {
  readonly biome: BiomeId;
  readonly level: ElevationLevel;
  /** Seed of the variant drawn: where the hills, trees and houses fall. */
  readonly seed: number;
  readonly region: string;
}

// The route is cut into pieces of about a day's walk on a 10,000-step goal; each piece shows one landscape.
export const SEGMENT_KM = 8;
// The same biome at most this far in a row when its region has others to offer.
export const MAX_RUN_KM = 30;

// A small integer hash (mulberry32 step) to a number in [0, 1): the same inputs always give the same value.
function unit(a: number, b: number): number {
  let x = (Math.imul(a, 0x9e3779b1) ^ Math.imul(b + 0x7f4a7c15, 0x85ebca6b)) >>> 0;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}

function pickWeighted<T extends { readonly weight: number }>(items: readonly T[], r: number): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let left = r * total;
  for (const item of items) {
    left -= item.weight;
    if (left < 0) return item;
  }
  return items[items.length - 1] as T;
}

function regionAt(regions: readonly Region[], km: number): Region {
  return regions.find((region) => km >= region.fromKm && km < region.toKm) ?? (regions[regions.length - 1] as Region);
}

// Pieces already worked out, per region table: each depends on the run before it, so they are laid
// down from the start of the route once and kept.
const laidDown = new WeakMap<readonly Region[], Landscape[]>();

/**
 * The landscape at `km` on a route: the piece of the route it falls in shows one biome from its region's
 * mix, drawn by weight from a hash of the piece's number and the route's `seed`, so it looks random but
 * is the same for every player, on every device and after every reload. A biome never runs longer than
 * MAX_RUN_KM when its region has another to offer; the level and the variant are drawn the same way.
 */
export function landscapeAt(regions: readonly Region[], km: number, seed: number): Landscape {
  const pieces = laidDown.get(regions) ?? [];
  laidDown.set(regions, pieces);
  const index = Math.max(0, Math.floor(km / SEGMENT_KM));
  for (let i = pieces.length; i <= index; i++) {
    const region = regionAt(regions, i * SEGMENT_KM);
    let run = 0;
    const previous = pieces[i - 1];
    for (let j = i - 1; j >= 0 && pieces[j]?.biome === previous?.biome && pieces[j]?.region === region.id; j--) run++;
    const tooLong = previous !== undefined && (run + 1) * SEGMENT_KM > MAX_RUN_KM;
    const others = region.mix.filter((share) => share.biome !== previous?.biome);
    const choice = pickWeighted(tooLong && others.length > 0 ? others : region.mix, unit(i, seed));
    const levels = choice.levels ?? BIOME_LEVELS[choice.biome];
    const level = levels[Math.floor(unit(i, seed + 1) * levels.length)] ?? 'mid';
    pieces.push({ biome: choice.biome, level, seed: Math.floor(unit(i, seed + 2) * 1_000_000), region: region.id });
  }
  return pieces[index] as Landscape;
}
