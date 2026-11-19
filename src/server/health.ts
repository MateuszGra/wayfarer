import type { FastifyInstance } from 'fastify';
import { ERROR_CODES } from '../shared/api/errorCodes.js';
import type { HealthResponse } from '../shared/api/contracts.js';
import { ApiError } from './errors.js';

export type DatabaseCheck = () => Promise<void>;

export function registerHealth(app: FastifyInstance, checkDatabase: DatabaseCheck): void {
  app.get('/api/health', async (): Promise<HealthResponse> => {
    try {
      await checkDatabase();
    } catch {
      throw new ApiError(ERROR_CODES.databaseUnavailable, 'Database is unavailable');
    }
    return { status: 'ok', database: 'ok' };
  });
}
