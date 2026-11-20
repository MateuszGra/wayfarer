import { describe, expect, it } from 'vitest';
import { BIOME_LEVELS } from '../biomes';
import { landscapeAt, MAX_RUN_KM, SEGMENT_KM, type Region } from './landscape';
import { BALTIC_SANTIAGO_REGIONS, BALTIC_SANTIAGO_SEED } from './regions/balticSantiago';

const ROUTE_KM = 3200;
const along = (regions: readonly Region[], seed: number) =>
  Array.from({ length: Math.ceil(ROUTE_KM / SEGMENT_KM) }, (_, i) => landscapeAt(regions, i * SEGMENT_KM, seed));

describe('the Baltic → Santiago regions', () => {
  it('cover the whole route from 0 to 3,200 km without gaps or overlaps', () => {
    const edges = BALTIC_SANTIAGO_REGIONS.map((region) => [region.fromKm, region.toKm]);

    expect(edges[0]?.[0]).toBe(0);
    expect(edges.at(-1)?.[1]).toBe(ROUTE_KM);
    expect(edges.slice(1).every(([from], i) => from === edges[i]?.[1])).toBe(true);
  });

  it('offer each biome only at levels it is drawn at', () => {
    const misfits = BALTIC_SANTIAGO_REGIONS.flatMap((region) =>
      region.mix.flatMap((share) => (share.levels ?? []).filter((level) => !BIOME_LEVELS[share.biome].includes(level))),
    );

    expect(misfits).toEqual([]);
  });
});

describe('landscapeAt', () => {
  it('starts the journey on the Baltic coast', () => {
    expect(landscapeAt(BALTIC_SANTIAGO_REGIONS, 0, BALTIC_SANTIAGO_SEED).biome).toBe('baltic');
  });

  it('gives the same landscape for the same place every time', () => {
    const regions = [...BALTIC_SANTIAGO_REGIONS];

    expect(landscapeAt(regions, 1234, 7)).toEqual(landscapeAt([...BALTIC_SANTIAGO_REGIONS], 1234, 7));
  });

  it('shows one landscape all along a piece of the route', () => {
    expect(landscapeAt(BALTIC_SANTIAGO_REGIONS, 800, 7)).toEqual(landscapeAt(BALTIC_SANTIAGO_REGIONS, 807.9, 7));
  });

  it('never shows the sea once the coast is behind', () => {
    const inland = along(BALTIC_SANTIAGO_REGIONS, BALTIC_SANTIAGO_SEED).slice(Math.ceil(56 / SEGMENT_KM));

    expect(inland.filter((landscape) => landscape.biome === 'baltic')).toEqual([]);
  });

  it('never runs one biome longer than the limit where the region has another', () => {
    const pieces = along(BALTIC_SANTIAGO_REGIONS, BALTIC_SANTIAGO_SEED);
    let longest = 0;
    let run = 0;
    pieces.forEach((piece, i) => {
      const region = BALTIC_SANTIAGO_REGIONS.find((r) => r.id === piece.region);
      const same = i > 0 && pieces[i - 1]?.biome === piece.biome && pieces[i - 1]?.region === piece.region;
      run = same && (region?.mix.length ?? 1) > 1 ? run + 1 : 1;
      longest = Math.max(longest, run);
    });

    expect(longest * SEGMENT_KM).toBeLessThanOrEqual(MAX_RUN_KM);
  });

  it('draws mostly the heaviest biome of a region', () => {
    const regions: Region[] = [
      {
        id: 'test',
        fromKm: 0,
        toKm: 3200,
        mix: [
          { biome: 'fields', weight: 8 },
          { biome: 'lakes', weight: 2 },
        ],
      },
    ];
    const share =
      along(regions, 3).filter((landscape) => landscape.biome === 'fields').length / (ROUTE_KM / SEGMENT_KM);

    expect(share).toBeGreaterThan(0.65);
  });
});
