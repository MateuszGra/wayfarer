import type { Weather } from '../weather/weather.js';

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

export interface CreateJourneyRequest {
  readonly routeId: string;
  readonly dailySteps: number;
  /** IANA time zone of the player, e.g. `Europe/Warsaw`; days on the road follow it. */
  readonly timeZone: string;
}

export interface ChangeJourneyRequest {
  readonly routeId: string;
  readonly dailySteps: number;
}

export interface RecordStepsRequest {
  readonly steps: number;
}

export interface JourneyDto {
  readonly routeId: string;
  readonly dailySteps: number;
  readonly timeZone: string;
  /** The first day on the road, `YYYY-MM-DD`, or null until the first steps are entered. */
  readonly startedOn: string | null;
  /** Distance walked on earlier routes before the current one was chosen. */
  readonly routeSinceKm: number;
}

export interface JourneyTodayDto {
  /** Today in the player's time zone, `YYYY-MM-DD`, as the server sees it. */
  readonly date: string;
  readonly day: number;
  /** The date whose steps the player is asked for today. */
  readonly stepsDate: string;
  readonly stepsEntered: number | null;
  /** Today's sunrise and sunset where the player is, as local hours; the walk keeps to them. */
  readonly daylight: { readonly sunriseHour: number; readonly sunsetHour: number };
  readonly walk: { readonly startHour: number; readonly endHour: number } | null;
  readonly kmAtDayStart: number;
  readonly kmToday: number;
  readonly history: readonly { readonly day: number; readonly date: string; readonly steps: number }[];
}

export interface JourneyResponse {
  readonly journey: JourneyDto;
  readonly today: JourneyTodayDto;
}

export interface WeatherResponse {
  /** The player's region, by name, e.g. `Słupsk`. */
  readonly region: string;
  readonly weather: Weather;
  readonly temperatureC: number;
  readonly windKmh: number;
  /** When Open-Meteo measured it, ISO 8601. */
  readonly observedAt: string;
}
