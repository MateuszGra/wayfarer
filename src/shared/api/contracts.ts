export interface HealthResponse {
  readonly status: 'ok';
  readonly database: 'ok';
}

/** A point on the route as [longitude, latitude]. */
export type RoutePoint = readonly [number, number];

export interface RouteSummaryDto {
  readonly id: string;
  readonly lengthKm: number;
  readonly path: readonly RoutePoint[];
}

export interface RouteListResponse {
  readonly routes: readonly RouteSummaryDto[];
}
