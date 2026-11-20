import type { Daylight } from '@shared/sun/daylight';

// Where the scene's own sun crosses the horizon. Its palette, sun path and evening camp were drawn for
// these hours, so the real day is mapped onto them rather than the other way round.
export const SCENE_DAYLIGHT: Daylight = { sunriseHour: 6, sunsetHour: 20 };

/**
 * The scene's hour for a real local hour, so the sun in the game rises and sets when it does outside the
 * player's window: real sunrise becomes the scene's sunrise and real sunset its sunset, and the hours
 * between (and the night around them) are stretched or squeezed evenly. Midnight stays midnight.
 */
export function sceneHour(realHour: number, daylight: Daylight): number {
  const real = daylight;
  const scene = SCENE_DAYLIGHT;
  if (realHour <= real.sunriseHour) return (realHour / real.sunriseHour) * scene.sunriseHour;
  if (realHour >= real.sunsetHour) {
    const share = (realHour - real.sunsetHour) / (24 - real.sunsetHour);
    return scene.sunsetHour + share * (24 - scene.sunsetHour);
  }
  const share = (realHour - real.sunriseHour) / (real.sunsetHour - real.sunriseHour);
  return scene.sunriseHour + share * (scene.sunsetHour - scene.sunriseHour);
}
