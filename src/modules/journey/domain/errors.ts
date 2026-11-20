import type { ErrorCode } from '../../../shared/api/errorCodes.js';

export type JourneyErrorCode = Extract<
  ErrorCode,
  'journey_not_found' | 'journey_exists' | 'unknown_route' | 'invalid_steps' | 'validation_failed'
>;

const MESSAGES: Record<JourneyErrorCode, string> = {
  journey_not_found: 'No journey has been planned yet',
  journey_exists: 'A journey is already planned',
  unknown_route: 'There is no such route',
  invalid_steps: 'Steps must be a whole number from 0 to 50000',
  validation_failed: 'Request validation failed',
};

/** An expected outcome of a journey use case that the player has to be told about. */
export class JourneyError extends Error {
  constructor(readonly code: JourneyErrorCode) {
    super(MESSAGES[code]);
  }
}
