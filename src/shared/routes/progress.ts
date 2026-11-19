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
