/**
 * Rare moments in the game's world that a player can witness, each worth a trophy of its own: the angler
 * driven off the lake by snow or a storm, and Bigfoot stepping out between the beeches.
 */
export const WORLD_EVENTS = ['anglerBeaten', 'bigfootSeen'] as const;

export type WorldEventId = (typeof WORLD_EVENTS)[number];

export function isWorldEvent(id: string): id is WorldEventId {
  return (WORLD_EVENTS as readonly string[]).includes(id);
}
