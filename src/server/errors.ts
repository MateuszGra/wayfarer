import type { FastifyError, FastifyInstance } from 'fastify';
import { AuthError } from '../modules/auth/index.js';
import { JourneyError } from '../modules/journey/index.js';
import { WeatherError } from '../modules/weather/index.js';
import { ERROR_CODES, type ApiErrorBody, type ErrorCode } from '../shared/api/errorCodes.js';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  not_found: 404,
  validation_failed: 400,
  database_unavailable: 503,
  internal_error: 500,
  unauthenticated: 401,
  invalid_credentials: 401,
  account_locked: 429,
  too_many_requests: 429,
  email_taken: 409,
  wrong_password: 403,
  password_too_short: 400,
  password_too_long: 400,
  password_unchanged: 400,
  password_breached: 400,
  journey_not_found: 404,
  journey_exists: 409,
  unknown_route: 400,
  invalid_steps: 400,
  weather_unavailable: 503,
};

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
  }

  get statusCode(): number {
    return STATUS_BY_CODE[this.code];
  }
}

export function errorBody(code: ErrorCode, message: string): ApiErrorBody {
  return { error: { code, message } };
}

export function registerErrorHandling(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | ApiError | AuthError | JourneyError | WeatherError, request, reply) => {
    if (error instanceof ApiError) {
      return reply.status(error.statusCode).send(errorBody(error.code, error.message));
    }
    if (error instanceof WeatherError) {
      return reply.status(STATUS_BY_CODE[error.code]).send(errorBody(error.code, error.message));
    }
    if (error instanceof JourneyError) {
      return reply.status(STATUS_BY_CODE[error.code]).send(errorBody(error.code, error.message));
    }
    if (error instanceof AuthError) {
      return reply.status(STATUS_BY_CODE[error.code]).send(errorBody(error.code, error.message));
    }
    if ('validation' in error && error.validation) {
      return reply.status(400).send(errorBody(ERROR_CODES.validationFailed, 'Request validation failed'));
    }
    request.log.error(error);
    return reply.status(500).send(errorBody(ERROR_CODES.internalError, 'Internal server error'));
  });
}
