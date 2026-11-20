import type { FastifyInstance, FastifyRequest, preHandlerAsyncHookHandler } from 'fastify';
import { SIGHTINGS, type SightingId } from '../../../shared/achievements/worldEvents.js';
import type { WorldEventsResponse } from '../../../shared/api/contracts.js';
import { recordWorldEvent, worldEvents, type AchievementsDependencies } from '../application/worldEventsService.js';

export interface AchievementsHttpOptions {
  /** Rejects requests without a signed-in player. */
  readonly signedIn: preHandlerAsyncHookHandler;
  /** The signed-in player's account, from the session (never from the request body or URL). */
  readonly accountOf: (request: FastifyRequest) => string;
}

// An unknown event fails validation like any other bad request.
const eventSchema = {
  params: {
    type: 'object',
    required: ['event'],
    properties: { event: { type: 'string', enum: [...SIGHTINGS] } },
  },
} as const;

export function registerAchievementsHttp(
  app: FastifyInstance,
  deps: AchievementsDependencies,
  options: AchievementsHttpOptions,
): void {
  const guarded = { preHandler: options.signedIn };

  app.get('/api/achievements/world', guarded, async (request): Promise<WorldEventsResponse> =>
    worldEvents(deps, options.accountOf(request)),
  );

  // PUT, since recording the same sighting again changes nothing.
  app.put<{ Params: { event: SightingId } }>(
    '/api/achievements/world/:event',
    { ...guarded, schema: eventSchema },
    async (request): Promise<WorldEventsResponse> =>
      recordWorldEvent(deps, options.accountOf(request), request.params.event),
  );
}
