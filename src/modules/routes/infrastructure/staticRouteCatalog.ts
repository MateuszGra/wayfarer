import { createRoute, routeId, type RouteCatalog } from '../domain/route.js';

// Routes are prepared offline by the route builder; until it exists, the catalogue is fixed data.
const ROUTES = [createRoute(routeId('baltic-santiago'), 3200)];

export function createStaticRouteCatalog(): RouteCatalog {
  return { all: async () => ROUTES };
}
