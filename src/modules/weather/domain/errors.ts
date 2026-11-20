/** Raised when there is no weather to give: the source failed and nothing is cached yet. */
export class WeatherError extends Error {
  readonly code = 'weather_unavailable' as const;
  constructor() {
    super('Weather is unavailable');
  }
}
