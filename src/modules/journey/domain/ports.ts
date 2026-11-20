import type { StepEntry } from '../../../shared/journey/journeyDay.js';
import type { Journey } from './journey.js';

export interface JourneyRepository {
  findByAccount(accountId: string): Promise<Journey | null>;
  /** Inserts a new journey; returns false when the account already has one. */
  add(journey: Journey): Promise<boolean>;
  /** Saves the plan (route, goal, start day, route offset). */
  savePlan(journey: Journey): Promise<void>;
  /** Inserts or corrects one day's steps. */
  saveEntry(journeyId: string, entry: StepEntry): Promise<void>;
}

/** Whether a route exists, from the routes module's catalog. */
export interface RouteLookup {
  exists(routeId: string): Promise<boolean>;
}

export interface Clock {
  now(): Date;
}
