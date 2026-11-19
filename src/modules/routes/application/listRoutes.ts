import type { RouteSummaryDto } from '../../../shared/api/contracts.js';
import type { RouteCatalog } from '../domain/route.js';

export async function listRoutes(catalog: RouteCatalog): Promise<RouteSummaryDto[]> {
  const routes = await catalog.all();
  return routes.map((route) => ({ id: route.id, lengthKm: route.lengthKm, path: route.path }));
}
