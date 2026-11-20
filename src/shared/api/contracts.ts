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

export interface CredentialsRequest {
  readonly email: string;
  readonly password: string;
}

export interface ChangePasswordRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
}

export interface AccountDto {
  readonly email: string;
}

export interface AccountResponse {
  readonly account: AccountDto;
}
