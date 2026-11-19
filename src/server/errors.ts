import type { FastifyError, FastifyInstance } from 'fastify';
import { ERROR_CODES, type ApiErrorBody, type ErrorCode } from '../shared/api/errorCodes.js';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  not_found: 404,
  validation_failed: 400,
  database_unavailable: 503,
  internal_error: 500,
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
  app.setErrorHandler((error: FastifyError | ApiError, request, reply) => {
    if (error instanceof ApiError) {
      return reply.status(error.statusCode).send(errorBody(error.code, error.message));
    }
    if ('validation' in error && error.validation) {
      return reply.status(400).send(errorBody(ERROR_CODES.validationFailed, 'Request validation failed'));
    }
    request.log.error(error);
    return reply.status(500).send(errorBody(ERROR_CODES.internalError, 'Internal server error'));
  });
}
