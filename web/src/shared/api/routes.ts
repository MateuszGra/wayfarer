import type { RouteListResponse, RouteSummaryDto } from '@shared/api/contracts';
import { apiGet } from '@/shared/api/client';

export async function fetchRoutes(): Promise<readonly RouteSummaryDto[]> {
  return (await apiGet<RouteListResponse>('/routes')).routes;
}
