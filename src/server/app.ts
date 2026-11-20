import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerAuthHttp, type AuthDependencies, type AuthHttpOptions } from '../modules/auth/index.js';
import { registerRoutesHttp, type RouteCatalog } from '../modules/routes/index.js';
import { ERROR_CODES } from '../shared/api/errorCodes.js';
import { errorBody, registerErrorHandling } from './errors.js';
import { registerHealth, type DatabaseCheck } from './health.js';

export interface AppDependencies {
  readonly checkDatabase: DatabaseCheck;
  readonly routeCatalog: RouteCatalog;
  readonly auth: AuthDependencies;
  readonly authHttp: AuthHttpOptions;
  /** Behind a reverse proxy (Passenger on MyDevil) the client address comes from X-Forwarded-For. */
  readonly trustProxy?: boolean;
  /** Directory with the built game; when present, unknown non-API paths fall back to its index.html. */
  readonly publicDir?: string;
  readonly logger?: boolean;
}

export async function buildApp(deps: AppDependencies): Promise<FastifyInstance> {
  const app = Fastify({ logger: deps.logger ?? false, trustProxy: deps.trustProxy ?? false });
  registerErrorHandling(app);

  registerHealth(app, deps.checkDatabase);
  registerRoutesHttp(app, deps.routeCatalog);
  registerAuthHttp(app, deps.auth, deps.authHttp);

  const publicDir = deps.publicDir ? resolve(deps.publicDir) : null;
  const serveGame = publicDir !== null && existsSync(resolve(publicDir, 'index.html'));
  if (serveGame) await app.register(fastifyStatic, { root: publicDir, wildcard: false });

  // The game uses History API routing (/scene, /map, ...), so every non-API path that is not a file gets index.html.
  app.setNotFoundHandler((request, reply) => {
    if (serveGame && !request.url.startsWith('/api/')) return reply.sendFile('index.html');
    return reply.status(404).send(errorBody(ERROR_CODES.notFound, `Route ${request.method} ${request.url} not found`));
  });

  return app;
}
