/**
 * Moments in the game's world that a player can witness, each worth a trophy of its own: a Ropucha corner
 * shop in a Polish village (rare, though the trophy jokes it is on every corner), the angler
 * landing a pike instead of the usual small fish, Bigfoot stepping out between the beeches, and the
 * lighthouse beam turning straight at the player at night.
 */
export const WORLD_EVENTS = ['ropuchaSeen', 'pikeCaught', 'bigfootSeen', 'lighthouseGlare'] as const;

export type WorldEventId = (typeof WORLD_EVENTS)[number];

export function isWorldEvent(id: string): id is WorldEventId {
  return (WORLD_EVENTS as readonly string[]).includes(id);
}

/** The songbirds that perch on the wanderer's pack or tent; the trophy for all of them is "Hitchcock". */
export const BIRD_SPECIES = ['starling', 'robin', 'tit', 'chaffinch', 'sparrow'] as const;
export type BirdSpecies = (typeof BIRD_SPECIES)[number];

/** Everything a player can be noted to have seen: a world event, or a bird species that perched. */
export type SightingId = WorldEventId | `bird:${BirdSpecies}`;
export const SIGHTINGS: readonly SightingId[] = [
  ...WORLD_EVENTS,
  ...BIRD_SPECIES.map((bird) => `bird:${bird}` as const),
];

export function isSighting(id: string): id is SightingId {
  return (SIGHTINGS as readonly string[]).includes(id);
}
