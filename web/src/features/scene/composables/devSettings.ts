import type { Weather } from '@shared/weather/weather';
import type { ElevationLevel } from '@/scene-engine';

/** What the developer panel last showed, so a reload in development comes back to the same view. */
export interface DevSettings {
  /** The hour set by hand, or null when following the clock. */
  readonly hour: number | null;
  readonly biome: string | null;
  readonly level: ElevationLevel | null;
  readonly beardDay: number | null;
  /** Weather set by hand, or null when following the API. */
  readonly weather: Weather | null;
  readonly walkMode: 'steps' | 'fullDay' | 'camp';
  readonly dayLengthIndex: number;
}

export const NO_DEV_SETTINGS: DevSettings = {
  hour: null,
  biome: null,
  level: null,
  beardDay: null,
  weather: null,
  walkMode: 'steps',
  dayLengthIndex: 0,
};

const KEY = 'wayfarer.devSettings';

/**
 * The settings saved in this browser. Only the local development build remembers them (never a deployed
 * game, even with `?dev`); without storage, or with something unreadable stored, the panel starts afresh.
 */
export function loadDevSettings(storage: Storage | null = safeStorage()): DevSettings {
  if (!import.meta.env.DEV || !storage) return NO_DEV_SETTINGS;
  try {
    const stored = JSON.parse(storage.getItem(KEY) ?? 'null') as Partial<DevSettings> | null;
    return stored && typeof stored === 'object' ? { ...NO_DEV_SETTINGS, ...stored } : NO_DEV_SETTINGS;
  } catch {
    return NO_DEV_SETTINGS;
  }
}

export function saveDevSettings(settings: DevSettings, storage: Storage | null = safeStorage()): void {
  if (!import.meta.env.DEV || !storage) return;
  try {
    storage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Not saved; the panel still works until the page reloads.
  }
}

function safeStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}
