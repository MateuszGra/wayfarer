import type { JourneyResponse } from '../../../shared/api/contracts.js';
import { JourneyError } from '../domain/errors.js';
import { Journey } from '../domain/journey.js';
import type { GeoPoint } from '../../../shared/sun/daylight.js';
import type { Clock, JourneyRepository, RouteLookup } from '../domain/ports.js';

export interface JourneyDependencies {
  readonly journeys: JourneyRepository;
  readonly routes: RouteLookup;
  readonly clock: Clock;
  readonly newId: () => string;
  /** Where the player is, for the hours of daylight. Everyone is in one region until regions come from IP. */
  readonly place: GeoPoint;
}

function view(journey: Journey, now: Date, place: GeoPoint): JourneyResponse {
  const s = journey.snapshot();
  const day = journey.today(now, place);
  return {
    journey: {
      routeId: s.routeId,
      dailySteps: s.dailySteps,
      timeZone: s.timeZone,
      startedOn: s.startedOn,
      routeSinceKm: s.routeSinceKm,
    },
    today: {
      date: day.today,
      day: day.day,
      stepsDate: day.stepsDate,
      stepsEntered: day.stepsEntered,
      daylight: day.daylight,
      walk: day.walk,
      kmAtDayStart: day.kmAtDayStart,
      kmToday: day.kmToday,
      history: day.history,
    },
  };
}

async function load(deps: JourneyDependencies, accountId: string): Promise<Journey> {
  const journey = await deps.journeys.findByAccount(accountId);
  if (!journey) throw new JourneyError('journey_not_found');
  return journey;
}

export async function planJourney(
  deps: JourneyDependencies,
  accountId: string,
  routeId: string,
  dailySteps: number,
  timeZone: string,
): Promise<JourneyResponse> {
  if (!(await deps.routes.exists(routeId))) throw new JourneyError('unknown_route');
  const journey = Journey.create(deps.newId(), accountId, routeId, dailySteps, timeZone);
  if (!(await deps.journeys.add(journey))) throw new JourneyError('journey_exists');
  return view(journey, deps.clock.now(), deps.place);
}

export async function currentJourney(deps: JourneyDependencies, accountId: string): Promise<JourneyResponse> {
  return view(await load(deps, accountId), deps.clock.now(), deps.place);
}

export async function recordSteps(
  deps: JourneyDependencies,
  accountId: string,
  steps: number,
): Promise<JourneyResponse> {
  const journey = await load(deps, accountId);
  const now = deps.clock.now();
  const entry = journey.recordYesterday(steps, now);
  await deps.journeys.saveEntry(journey.snapshot().id, entry);
  await deps.journeys.savePlan(journey);
  return view(journey, now, deps.place);
}

export async function changePlan(
  deps: JourneyDependencies,
  accountId: string,
  routeId: string,
  dailySteps: number,
): Promise<JourneyResponse> {
  if (!(await deps.routes.exists(routeId))) throw new JourneyError('unknown_route');
  const journey = await load(deps, accountId);
  const now = deps.clock.now();
  journey.changePlan(routeId, dailySteps, now);
  await deps.journeys.savePlan(journey);
  return view(journey, now, deps.place);
}
