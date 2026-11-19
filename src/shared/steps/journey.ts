import { DEFAULT_STRIDE_METRES, distanceKm } from './dailyWalk.js';

/** Whole days needed to cover a route when walking `dailySteps` every day (the last, partial day counts). */
export function journeyDays(
  lengthKm: number,
  dailySteps: number,
  strideMetres: number = DEFAULT_STRIDE_METRES,
): number {
  if (!(lengthKm > 0)) throw new RangeError(`Route length must be positive, got ${lengthKm}`);
  if (!Number.isInteger(dailySteps) || dailySteps <= 0) {
    throw new RangeError(`Daily steps must be a positive integer, got ${dailySteps}`);
  }
  return Math.ceil(lengthKm / distanceKm(dailySteps, strideMetres));
}

/** The calendar day of arrival when the journey starts on `start` (day one) and takes `days` days. */
export function arrivalDate(start: Date, days: number): Date {
  const arrival = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  arrival.setDate(arrival.getDate() + days - 1);
  return arrival;
}
