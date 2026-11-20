import type { FastifyInstance, FastifyRequest, preHandlerAsyncHookHandler } from 'fastify';
import type {
  ChangeJourneyRequest,
  CreateJourneyRequest,
  JourneyResponse,
  RecordStepsRequest,
} from '../../../shared/api/contracts.js';
import {
  changePlan,
  currentJourney,
  planJourney,
  recordSteps,
  type JourneyDependencies,
} from '../application/journeyService.js';

export interface JourneyHttpOptions {
  /** Rejects requests without a signed-in player. */
  readonly signedIn: preHandlerAsyncHookHandler;
  /** The signed-in player's account, from the session (never from the request body or URL). */
  readonly accountOf: (request: FastifyRequest) => string;
}

const plan = {
  routeId: { type: 'string', minLength: 1, maxLength: 100 },
  dailySteps: { type: 'integer' },
} as const;
const createSchema = {
  body: {
    type: 'object',
    required: ['routeId', 'dailySteps', 'timeZone'],
    additionalProperties: false,
    properties: { ...plan, timeZone: { type: 'string', minLength: 1, maxLength: 64 } },
  },
} as const;
const changeSchema = {
  body: { type: 'object', required: ['routeId', 'dailySteps'], additionalProperties: false, properties: plan },
} as const;
// Any number is let through to the use case, so out-of-range steps get their own error code.
const stepsSchema = {
  body: { type: 'object', required: ['steps'], additionalProperties: false, properties: { steps: { type: 'number' } } },
} as const;

export function registerJourneyHttp(
  app: FastifyInstance,
  deps: JourneyDependencies,
  options: JourneyHttpOptions,
): void {
  const guarded = { preHandler: options.signedIn };

  app.get('/api/journey', guarded, async (request): Promise<JourneyResponse> =>
    currentJourney(deps, options.accountOf(request)),
  );

  app.post<{ Body: CreateJourneyRequest }>(
    '/api/journey',
    { ...guarded, schema: createSchema },
    async (request, reply): Promise<JourneyResponse> => {
      const { routeId, dailySteps, timeZone } = request.body;
      const journey = await planJourney(deps, options.accountOf(request), routeId, dailySteps, timeZone);
      void reply.status(201);
      return journey;
    },
  );

  app.put<{ Body: ChangeJourneyRequest }>(
    '/api/journey',
    { ...guarded, schema: changeSchema },
    async (request): Promise<JourneyResponse> =>
      changePlan(deps, options.accountOf(request), request.body.routeId, request.body.dailySteps),
  );

  app.put<{ Body: RecordStepsRequest }>(
    '/api/journey/steps',
    { ...guarded, schema: stepsSchema },
    async (request): Promise<JourneyResponse> => recordSteps(deps, options.accountOf(request), request.body.steps),
  );
}
