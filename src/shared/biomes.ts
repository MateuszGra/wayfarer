/** The landscapes the scene can draw. Each has its look in the scene engine. */
export const BIOME_IDS = ['baltic', 'lakes', 'fields', 'forest', 'mountains', 'meseta'] as const;
export type BiomeId = (typeof BIOME_IDS)[number];

export type ElevationLevel = 'low' | 'mid' | 'high';

/** The levels each biome is drawn at; a biome without heights is always 'mid'. */
export const BIOME_LEVELS: Record<BiomeId, readonly ElevationLevel[]> = {
  baltic: ['mid'],
  lakes: ['mid'],
  fields: ['mid'],
  forest: ['low', 'mid', 'high'],
  mountains: ['low', 'mid', 'high'],
  meseta: ['mid'],
};
