import type { RoutePoint } from '../api/contracts.js';

const EARTH_RADIUS_KM = 6371;

function haversineKm([lon1, lat1]: RoutePoint, [lon2, lat2]: RoutePoint): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export interface RouteProgress {
  /** From the start to the traveller's position. */
  readonly walked: readonly RoutePoint[];
  /** From the traveller's position to the end. */
  readonly remaining: readonly RoutePoint[];
  readonly position: RoutePoint;
  /** Share of the route behind the traveller, 0..1. */
  readonly fraction: number;
}

/**
 * Where the traveller is on the drawn path after `doneKm` of a route `lengthKm` long. The drawn path is a
 * coarse line through towns and is shorter than the walking route, so distances along it are scaled to
 * the route length rather than measured literally.
 */
export function routeProgress(path: readonly RoutePoint[], lengthKm: number, doneKm: number): RouteProgress {
  const first = path[0];
  if (!first || path.length < 2) throw new RangeError('A route path needs at least two points');
  if (!(lengthKm > 0)) throw new RangeError(`Route length must be positive, got ${lengthKm}`);
  if (!(doneKm >= 0)) throw new RangeError(`Distance walked cannot be negative, got ${doneKm}`);

  const fraction = Math.min(1, doneKm / lengthKm);
  if (fraction === 0) return { walked: [first], remaining: path, position: first, fraction };
  const segments = path.slice(1).map((point, i) => haversineKm(path[i] as RoutePoint, point));
  const drawnLength = segments.reduce((sum, km) => sum + km, 0);
  let left = drawnLength * fraction;

  const walked: RoutePoint[] = [first];
  for (let i = 0; i < segments.length; i++) {
    const from = path[i] as RoutePoint;
    const to = path[i + 1] as RoutePoint;
    const km = segments[i] as number;
    if (left < km) {
      const t = km === 0 ? 0 : left / km;
      const position: RoutePoint = [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
      walked.push(position);
      return { walked, remaining: [position, ...path.slice(i + 1)], position, fraction };
    }
    left -= km;
    walked.push(to);
  }
  const end = path[path.length - 1] as RoutePoint;
  return { walked, remaining: [end], position: end, fraction };
}

/**
 * The stretch of the drawn path today's steps cover: from where the traveller started the day to where
 * the day's distance takes him. Shown apart from the rest of the walked route, so the player sees what
 * yesterday's steps earned the moment they are entered.
 */
export function todaySegment(
  path: readonly RoutePoint[],
  lengthKm: number,
  doneKm: number,
  todayKm: number,
): RoutePoint[] {
  const before = routeProgress(path, lengthKm, Math.max(0, doneKm - todayKm));
  const after = routeProgress(path, lengthKm, doneKm);
  const points = [before.position, ...after.walked.slice(before.walked.length - 1)];
  // Where the day starts on a bend or at the very start, that point is in both lists; keep it once.
  return points.filter((p, i) => i === 0 || p[0] !== points[i - 1]?.[0] || p[1] !== points[i - 1]?.[1]);
}
