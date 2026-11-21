import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type {
  AccountResponse,
  ChangePasswordRequest,
  ConfirmEmailCodeRequest,
  ConfirmEmailRequest,
  CredentialsRequest,
  EmailRequest,
  ResetPasswordRequest,
} from '../../../shared/api/contracts.js';
import { MAX_EMAIL_LENGTH, normalizeEmail } from '../../../shared/auth/email.js';
import {
  authenticate,
  changePassword,
  confirmEmail,
  confirmEmailWithCode,
  currentAccount,
  login,
  logout,
  register,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  type AuthDependencies,
  type Authenticated,
} from '../application/authService.js';
import { AuthError } from '../domain/errors.js';
import { AttemptLimiter } from './attemptLimiter.js';
import { clearedSessionCookie, readSessionToken, sessionCookie } from './sessionCookie.js';

export interface AuthHttpOptions {
  readonly secureCookies: boolean;
  /** Limits sign-in, sign-up and password changes per client address. */
  readonly limiter: AttemptLimiter;
  /** Limits links by e-mail per address and kind, so nobody can flood someone's mailbox. */
  readonly mailLimiter?: AttemptLimiter;
}

// Three links of one kind an hour to one address is plenty for a player who lost the first e-mail.
const LINKS_PER_ADDRESS = 3;
const LINK_WINDOW_MS = 60 * 60 * 1000;

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
  response: { 200: accountResponse },
} as const;
const changePasswordSchema = {
  body: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    additionalProperties: false,
    properties: { currentPassword: PASSWORD_FIELD, newPassword: PASSWORD_FIELD },
  },
} as const;

const confirmEmailSchema = {
  body: {
    type: 'object',
    required: ['token'],
    additionalProperties: false,
    properties: { token: { type: 'string', minLength: 1, maxLength: 256 } },
  },
  response: { 200: accountResponse },
} as const;

const confirmEmailCodeSchema = {
  body: {
    type: 'object',
    required: ['email', 'code'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', maxLength: MAX_EMAIL_LENGTH + 64 },
      code: { type: 'string', maxLength: 32 },
    },
  },
  response: { 200: accountResponse },
} as const;

const emailSchema = {
  body: {
    type: 'object',
    required: ['email'],
    additionalProperties: false,
    properties: { email: { type: 'string', maxLength: MAX_EMAIL_LENGTH + 64 } },
  },
} as const;
const resetPasswordSchema = {
  body: {
    type: 'object',
    required: ['token', 'newPassword'],
    additionalProperties: false,
    properties: { token: { type: 'string', minLength: 1, maxLength: 256 }, newPassword: PASSWORD_FIELD },
  },
  response: { 200: accountResponse },
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
  const mailLimiter = options.mailLimiter ?? new AttemptLimiter(LINKS_PER_ADDRESS, LINK_WINDOW_MS);
  const mayMail = (kind: string, email: string): boolean =>
    mailLimiter.attempt(`${kind}:${normalizeEmail(email)}`, deps.clock.now());

  // No session yet: the player signs in by following the confirmation link.
  app.post<{ Body: CredentialsRequest }>(
    '/api/auth/register',
    { schema: credentialsSchema },
    async (request, reply) => {
      limit(request);
      await register(deps, request.body.email, request.body.password);
      return reply.status(204).send();
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

  app.post<{ Body: ConfirmEmailRequest }>(
    '/api/auth/verify-email',
    { schema: confirmEmailSchema },
    async (request, reply): Promise<AccountResponse> => {
      limit(request);
      const signedIn = await confirmEmail(deps, request.body.token);
      setSession(reply, signedIn.token);
      return { account: signedIn.account };
    },
  );

  // Each try counts towards the client's limit as well as the code's own five tries.
  app.post<{ Body: ConfirmEmailCodeRequest }>(
    '/api/auth/verify-email/code',
    { schema: confirmEmailCodeSchema },
    async (request, reply): Promise<AccountResponse> => {
      limit(request);
      const signedIn = await confirmEmailWithCode(deps, request.body.email, request.body.code);
      setSession(reply, signedIn.token);
      return { account: signedIn.account };
    },
  );

  // Always 204, whether the address has an unconfirmed account, has had too many links, or got one now.
  app.post<{ Body: EmailRequest }>('/api/auth/verify-email/resend', { schema: emailSchema }, async (request, reply) => {
    limit(request);
    if (mayMail('verify', request.body.email)) await resendVerification(deps, request.body.email);
    return reply.status(204).send();
  });

  // Always 204, whether the address has an account, has had too many links, or got one now.
  app.post<{ Body: EmailRequest }>('/api/auth/password-reset', { schema: emailSchema }, async (request, reply) => {
    limit(request);
    if (mayMail('reset', request.body.email)) await requestPasswordReset(deps, request.body.email);
    return reply.status(204).send();
  });

  app.post<{ Body: ResetPasswordRequest }>(
    '/api/auth/password-reset/confirm',
    { schema: resetPasswordSchema },
    async (request, reply): Promise<AccountResponse> => {
      limit(request);
      const signedIn = await resetPassword(deps, request.body.token, request.body.newPassword);
      setSession(reply, signedIn.token);
      return { account: signedIn.account };
    },
  );
}

/** A preHandler for routes that need a signed-in player; the player is then on `request.auth`. */
export function requireSession(deps: AuthDependencies) {
  return async (request: FastifyRequest): Promise<void> => {
    request.auth = await authenticate(deps, readSessionToken(request.headers.cookie));
  };
}
