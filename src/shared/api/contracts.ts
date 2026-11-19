export interface HealthResponse {
  readonly status: 'ok';
  readonly database: 'ok';
}

export interface RouteSummaryDto {
  readonly id: string;
  readonly lengthKm: number;
}

export interface RouteListResponse {
  readonly routes: readonly RouteSummaryDto[];
}
