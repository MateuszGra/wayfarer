import { localHour, type LocalDate } from '../journey/calendar.js';

/** A place on Earth in degrees; east and north are positive. */
export interface GeoPoint {
  readonly latitude: number;
  readonly longitude: number;
}

/** When the sun rises and sets on a day, as local hours in the player's time zone (15.5 is 15:30). */
export interface Daylight {
  readonly sunriseHour: number;
  readonly sunsetHour: number;
}

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
// Julian day of 2000-01-01 12:00 UTC (J2000) and of the Unix epoch.
const J2000 = 2_451_545;
const UNIX_EPOCH_JD = 2_440_587.5;
// The sun counts as risen when its upper edge clears the horizon: its radius plus atmospheric refraction.
const SUNRISE_ALTITUDE = -0.833;
const EARTH_TILT = 23.4397;

/**
 * Sunrise and sunset on `date` at `place`, from the sunrise equation (accurate to a minute or two, which is
 * plenty for a walk). Returns null on a day the sun never rises or never sets (beyond the polar circles).
 */
export function daylightOn(date: LocalDate, timeZone: string, place: GeoPoint): Daylight | null {
  const noonJd = Date.parse(`${date}T12:00:00Z`) / DAY_MS + UNIX_EPOCH_JD;
  // Mean solar noon at the place, in days since J2000.
  const meanNoon = Math.round(noonJd - J2000) - place.longitude / 360;
  const anomaly = (357.5291 + 0.98560028 * meanNoon) % 360;
  const centre =
    1.9148 * Math.sin(anomaly * RAD) + 0.02 * Math.sin(2 * anomaly * RAD) + 0.0003 * Math.sin(3 * anomaly * RAD);
  const eclipticLongitude = (anomaly + centre + 180 + 102.9372) % 360;
  const transit = J2000 + meanNoon + 0.0053 * Math.sin(anomaly * RAD) - 0.0069 * Math.sin(2 * eclipticLongitude * RAD);
  const declination = Math.asin(Math.sin(eclipticLongitude * RAD) * Math.sin(EARTH_TILT * RAD));
  const latitude = place.latitude * RAD;
  const cosHourAngle =
    (Math.sin(SUNRISE_ALTITUDE * RAD) - Math.sin(latitude) * Math.sin(declination)) /
    (Math.cos(latitude) * Math.cos(declination));
  if (cosHourAngle < -1 || cosHourAngle > 1) return null;
  const halfDay = Math.acos(cosHourAngle) / RAD / 360;
  const toLocalHour = (jd: number): number => localHour(new Date((jd - UNIX_EPOCH_JD) * DAY_MS), timeZone);
  return { sunriseHour: toLocalHour(transit - halfDay), sunsetHour: toLocalHour(transit + halfDay) };
}
