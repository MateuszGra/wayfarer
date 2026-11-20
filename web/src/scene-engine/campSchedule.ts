/** Today's walk in scene hours, as the scene gets it; `leadHours` is the time to get up and pack before it. */
export interface CampWalk {
  readonly startHour: number;
  readonly endHour: number;
  readonly leadHours?: number;
}

// Getting up and packing before a walk that starts at dawn takes a while; when the player only just
// entered the steps later in the day, he gets going after a short stretch instead.
export const MORNING_LEAD_H = 0.6;
// After a full day on the road he pitches camp at dusk.
const DUSK_PITCH_H = 19.3;

export const leadOf = (walk: CampWalk): number => walk.leadHours ?? MORNING_LEAD_H;

/**
 * When he starts pitching camp: as soon as the walk ends, so after a short walk (few steps, or steps
 * entered late) he rests at camp for the rest of the day instead of on the bare road; never later than dusk.
 * With no walk the camp stands all day and this is only the evening.
 */
export function pitchHour(walk: CampWalk | null): number {
  return walk ? Math.min(walk.endHour, DUSK_PITCH_H) : DUSK_PITCH_H;
}

// In the morning the camp stays until he packs it for today's walk; with no walk today it stays all day.
const packedAway = (h: number, walk: CampWalk | null, share: number): boolean =>
  !!walk && h >= walk.startHour - leadOf(walk) * share;

/** Whether the tent stands at hour `h`. */
export function tentUp(h: number, walk: CampWalk | null): boolean {
  return h >= pitchHour(walk) + 0.6 || !packedAway(h, walk, 0.67);
}

/** Whether the stump he sits on is out: it comes out before the tent stands, and is packed before it. */
export function seatOut(h: number, walk: CampWalk | null): boolean {
  return h >= pitchHour(walk) + 0.2 || !packedAway(h, walk, 0.8);
}
