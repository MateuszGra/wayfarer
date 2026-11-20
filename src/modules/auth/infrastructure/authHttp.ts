import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AccountResponse, ChangePasswordRequest, CredentialsRequest } from '../../../shared/api/contracts.js';
import { MAX_EMAIL_LENGTH } from '../../../shared/auth/email.js';
import {
  authenticate,
  changePassword,
  currentAccount,
  login,
  logout,
  register,
  type AuthDependencies,
  type Authenticated,
} from '../application/authService.js';
import { AuthError } from '../domain/errors.js';
import type { AttemptLimiter } from './attemptLimiter.js';
import { clearedSessionCookie, readSessionToken, sessionCookie } from './sessionCookie.js';

export interface AuthHttpOptions {
  readonly secureCookies: boolean;
  /** Limits sign-in, sign-up and password changes per client address. */
  readonly limiter: AttemptLimiter;
}

// Long enough for any real password (the use case rejects anything over the length rule with its own
// code), short enough that nobody can make the server hash megabytes.
const PASSWORD_FIELD = { type: 'string', maxLength: 1024 } as const;
const accountResponse = {
  type: 'object',
  required: ['account'],
  properties: { account: { type: 'object', required: ['email'], properties: { email: { type: 'string' } } } },
} as const;
const credentialsSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    additionalProperties: false,
    properties: { email: { type: 'string', maxLength: MAX_EMAIL_LENGTH + 64 }, password: PASSWORD_FIELD },
  },
  response: { 200: accountResponse, 201: accountResponse },
} as const;
const changePasswordSchema = {
  body: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    additionalProperties: false,
    properties: { currentPassword: PASSWORD_FIELD, newPassword: PASSWORD_FIELD },
  },
} as const;

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by `requireSession` on routes that need a signed-in player. */
    auth?: Authenticated;
  }
}

export function registerAuthHttp(app: FastifyInstance, deps: AuthDependencies, options: AuthHttpOptions): void {
  const token = (request: FastifyRequest): string | null => readSessionToken(request.headers.cookie);
  const limit = (request: FastifyRequest): void => {
    if (!options.limiter.attempt(request.ip, deps.clock.now())) throw new AuthError('too_many_requests');
  };
  const setSession = (reply: FastifyReply, value: string): void => {
    void reply.header('set-cookie', sessionCookie(value, options.secureCookies));
  };

  app.post<{ Body: CredentialsRequest }>(
    '/api/auth/register',
    { schema: credentialsSchema },
    async (request, reply): Promise<AccountResponse> => {
      limit(request);
      const signedIn = await register(deps, request.body.email, request.body.password);
      setSession(reply, signedIn.token);
      void reply.status(201);
      return { account: signedIn.account };
    },
  );

  app.post<{ Body: CredentialsRequest }>(
    '/api/auth/login',
    { schema: credentialsSchema },
    async (request, reply): Promise<AccountResponse> => {
      limit(request);
      const signedIn = await login(deps, request.body.email, request.body.password);
      setSession(reply, signedIn.token);
      return { account: signedIn.account };
    },
  );

  app.post('/api/auth/logout', async (request, reply) => {
    await logout(deps, token(request));
    return reply.header('set-cookie', clearedSessionCookie(options.secureCookies)).status(204).send();
  });

  app.get(
    '/api/auth/me',
    { schema: { response: { 200: accountResponse } } },
    async (request): Promise<AccountResponse> => ({
      account: await currentAccount(deps, token(request)),
    }),
  );

  app.post<{ Body: ChangePasswordRequest }>(
    '/api/auth/password',
    { schema: changePasswordSchema },
    async (request, reply) => {
      limit(request);
      await changePassword(deps, token(request), request.body.currentPassword, request.body.newPassword);
      return reply.status(204).send();
    },
  );
}

/** A preHandler for routes that need a signed-in player; the player is then on `request.auth`. */
export function requireSession(deps: AuthDependencies) {
  return async (request: FastifyRequest): Promise<void> => {
    request.auth = await authenticate(deps, readSessionToken(request.headers.cookie));
  };
}
