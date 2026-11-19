// Public API of the routes module. Other modules and the server import only from here.
export type { Route, RouteCatalog, RouteId, RoutePoint } from './domain/route.js';
export { listRoutes } from './application/listRoutes.js';
export { createStaticRouteCatalog } from './infrastructure/staticRouteCatalog.js';
export { registerRoutesHttp } from './infrastructure/routesHttp.js';
