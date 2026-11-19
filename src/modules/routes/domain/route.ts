declare const routeIdBrand: unique symbol;
export type RouteId = string & { readonly [routeIdBrand]: true };

const ROUTE_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function routeId(value: string): RouteId {
  if (!ROUTE_ID_PATTERN.test(value)) throw new RangeError(`Invalid route id "${value}"`);
  return value as RouteId;
}

/** [longitude, latitude] */
export type RoutePoint = readonly [number, number];

export interface Route {
  readonly id: RouteId;
  readonly lengthKm: number;
  readonly path: readonly RoutePoint[];
}

export function createRoute(id: RouteId, lengthKm: number, path: readonly RoutePoint[]): Route {
  if (!(lengthKm > 0)) throw new RangeError(`Route length must be positive, got ${lengthKm}`);
  if (path.length < 2) throw new RangeError('A route needs at least a start and an end point');
  for (const [lon, lat] of path) {
    if (Math.abs(lon) > 180 || Math.abs(lat) > 90) throw new RangeError(`Invalid route point [${lon}, ${lat}]`);
  }
  return { id, lengthKm, path };
}

export interface RouteCatalog {
  all(): Promise<readonly Route[]>;
}
