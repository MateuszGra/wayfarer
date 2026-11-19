declare const routeIdBrand: unique symbol;
export type RouteId = string & { readonly [routeIdBrand]: true };

const ROUTE_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function routeId(value: string): RouteId {
  if (!ROUTE_ID_PATTERN.test(value)) throw new RangeError(`Invalid route id "${value}"`);
  return value as RouteId;
}

export interface Route {
  readonly id: RouteId;
  readonly lengthKm: number;
}

export function createRoute(id: RouteId, lengthKm: number): Route {
  if (!(lengthKm > 0)) throw new RangeError(`Route length must be positive, got ${lengthKm}`);
  return { id, lengthKm };
}

export interface RouteCatalog {
  all(): Promise<readonly Route[]>;
}
