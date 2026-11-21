import type { Weather } from '@shared/weather/weather';

export interface CatWear {
  /** The knitted jumper. */
  readonly coat: boolean;
  /** The yellow rain cape with the hood up. */
  readonly cape: boolean;
}

/**
 * The jumper in the frost and whenever it snows; the cape in rain, in a downpour and in a thunderstorm's
 * drizzle (plain drizzle doesn't bother it). In freezing rain, both.
 */
export function catWear(weather: Pick<Weather, 'precipitation' | 'storm' | 'frost'>): CatWear {
  const fall = weather.precipitation;
  return {
    coat: weather.frost || fall === 'snow' || fall === 'heavySnow',
    cape: fall === 'rain' || fall === 'heavyRain' || (weather.storm && fall === 'drizzle'),
  };
}
