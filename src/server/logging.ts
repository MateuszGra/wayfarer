import type { FastifyRequest } from 'fastify';

/**
 * What a request leaves in the log: the method and the path. Never the client's address (we keep no IPs,
 * see the brief) and never the query, which can carry a one-time token from an e-mail link.
 */
export function requestForLog(request: Pick<FastifyRequest, 'method' | 'url'>): { method: string; url: string } {
  return { method: request.method, url: request.url.split('?')[0] ?? '' };
}
