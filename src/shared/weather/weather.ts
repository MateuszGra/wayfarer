/**
 * The game's weather, layered rather than one picture per case: the sky, what falls from it, a storm on
 * top, the wind and the cold each change the scene on their own. Every biome uses the same layers.
 */
export type Sky = 'clear' | 'partly' | 'overcast' | 'fog';
export type Precipitation = 'none' | 'drizzle' | 'rain' | 'heavyRain' | 'snow' | 'heavySnow';
export type Wind = 'calm' | 'breeze' | 'strong';

export interface Weather {
  readonly sky: Sky;
  readonly precipitation: Precipitation;
  readonly storm: boolean;
  readonly wind: Wind;
  /** At or below FROST_C: breath shows, hoarfrost on the grass. */
  readonly frost: boolean;
}

/** What Open-Meteo reports now, reduced to what the game uses. */
export interface WeatherReading {
  /** WMO weather code, as Open-Meteo gives it (0–99). */
  readonly code: number;
  readonly temperatureC: number;
  readonly windKmh: number;
}

type SkyAndFall = Pick<Weather, 'sky' | 'precipitation' | 'storm'>;
const SKY_AND_FALL: Record<number, SkyAndFall> = {
  0: { sky: 'clear', precipitation: 'none', storm: false },
  1: { sky: 'clear', precipitation: 'none', storm: false },
  2: { sky: 'partly', precipitation: 'none', storm: false },
  3: { sky: 'overcast', precipitation: 'none', storm: false },
  45: { sky: 'fog', precipitation: 'none', storm: false },
  48: { sky: 'fog', precipitation: 'none', storm: false },
  51: { sky: 'overcast', precipitation: 'drizzle', storm: false },
  53: { sky: 'overcast', precipitation: 'drizzle', storm: false },
  55: { sky: 'overcast', precipitation: 'drizzle', storm: false },
  56: { sky: 'overcast', precipitation: 'drizzle', storm: false },
  57: { sky: 'overcast', precipitation: 'drizzle', storm: false },
  61: { sky: 'overcast', precipitation: 'rain', storm: false },
  63: { sky: 'overcast', precipitation: 'rain', storm: false },
  65: { sky: 'overcast', precipitation: 'heavyRain', storm: false },
  66: { sky: 'overcast', precipitation: 'rain', storm: false },
  67: { sky: 'overcast', precipitation: 'heavyRain', storm: false },
  71: { sky: 'overcast', precipitation: 'snow', storm: false },
  73: { sky: 'overcast', precipitation: 'snow', storm: false },
  75: { sky: 'overcast', precipitation: 'heavySnow', storm: false },
  77: { sky: 'overcast', precipitation: 'snow', storm: false },
  // Showers come out of a broken sky, with sun between them.
  80: { sky: 'partly', precipitation: 'rain', storm: false },
  81: { sky: 'partly', precipitation: 'rain', storm: false },
  82: { sky: 'overcast', precipitation: 'heavyRain', storm: false },
  85: { sky: 'partly', precipitation: 'snow', storm: false },
  86: { sky: 'overcast', precipitation: 'heavySnow', storm: false },
  95: { sky: 'overcast', precipitation: 'rain', storm: true },
  96: { sky: 'overcast', precipitation: 'heavyRain', storm: true },
  99: { sky: 'overcast', precipitation: 'heavyRain', storm: true },
};

// Beaufort 3 (a gentle breeze) moves grass and smoke visibly; Beaufort 6 (a strong breeze, 39 km/h) bends
// trees and tugs at the cape.
export const BREEZE_KMH = 12;
export const STRONG_WIND_KMH = 39;

// At 0 °C a damp day still reads as thaw; from −1 °C the cold is plain enough to show.
export const FROST_C = -1;

export function windOf(kmh: number): Wind {
  if (kmh >= STRONG_WIND_KMH) return 'strong';
  return kmh >= BREEZE_KMH ? 'breeze' : 'calm';
}

/** The scene's weather from a reading; an unknown code shows as an overcast, dry sky. */
export function weatherOf(reading: WeatherReading): Weather {
  const fall = SKY_AND_FALL[reading.code] ?? { sky: 'overcast', precipitation: 'none', storm: false };
  return { ...fall, wind: windOf(reading.windKmh), frost: reading.temperatureC <= FROST_C };
}
