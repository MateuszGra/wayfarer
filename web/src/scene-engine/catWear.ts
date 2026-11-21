import type { Weather } from '@shared/weather/weather';

export interface CatWear {
  /** The knitted jumper. */
  readonly coat: boolean;
  /** The yellow rain cape with the hood up. */
  readonly cape: boolean;
}

/** The jumper in the frost and whenever it snows; the cape in rain and in a downpour, never in drizzle. In freezing rain, both. */
export function catWear(weather: Pick<Weather, 'precipitation' | 'frost'>): CatWear {
  const fall = weather.precipitation;
  return {
    coat: weather.frost || fall === 'snow' || fall === 'heavySnow',
    cape: fall === 'rain' || fall === 'heavyRain',
  };
}
