import type { WeatherReading } from '../../../shared/weather/weather.js';
import type { Region } from './region.js';

export interface Observation extends WeatherReading {
  readonly observedAt: Date;
}

/** The current weather at a region; throws when the source can't be reached. */
export interface WeatherSource {
  current(region: Region): Promise<Observation>;
}

export interface Clock {
  now(): Date;
}
