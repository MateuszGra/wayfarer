// The single list of API error codes, shared by the server (which sends them) and the game (which maps them to UI text).
export const ERROR_CODES = {
  notFound: 'not_found',
  validationFailed: 'validation_failed',
  databaseUnavailable: 'database_unavailable',
  internalError: 'internal_error',
  unauthenticated: 'unauthenticated',
  invalidCredentials: 'invalid_credentials',
  accountLocked: 'account_locked',
  tooManyRequests: 'too_many_requests',
  emailTaken: 'email_taken',
  wrongPassword: 'wrong_password',
  passwordTooShort: 'password_too_short',
  passwordTooLong: 'password_too_long',
  passwordUnchanged: 'password_unchanged',
  passwordBreached: 'password_breached',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ApiErrorBody {
  readonly error: {
    readonly code: ErrorCode;
    readonly message: string;
  };
}
