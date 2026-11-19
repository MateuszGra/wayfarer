import type { FastifyInstance } from 'fastify';
import type { RouteListResponse } from '../../../shared/api/contracts.js';
import { listRoutes } from '../application/listRoutes.js';
import type { RouteCatalog } from '../domain/route.js';

const routeListSchema = {
  response: {
    200: {
      type: 'object',
      required: ['routes'],
      properties: {
        routes: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'lengthKm', 'path'],
            properties: {
              id: { type: 'string' },
              lengthKm: { type: 'number' },
              path: {
                type: 'array',
                items: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
              },
            },
          },
        },
      },
    },
  },
} as const;

export function registerRoutesHttp(app: FastifyInstance, catalog: RouteCatalog): void {
  app.get('/api/routes', { schema: routeListSchema }, async (): Promise<RouteListResponse> => ({
    routes: await listRoutes(catalog),
  }));
}
