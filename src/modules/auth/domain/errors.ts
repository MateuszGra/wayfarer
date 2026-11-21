import type { ErrorCode } from '../../../shared/api/errorCodes.js';

/** An expected outcome of an auth use case that the player has to be told about. */
export class AuthError extends Error {
  constructor(readonly code: Extract<ErrorCode, AuthErrorCode>) {
    super(AUTH_MESSAGES[code]);
  }
}

export type AuthErrorCode =
  | 'unauthenticated'
  | 'invalid_credentials'
  | 'account_locked'
  | 'too_many_requests'
  | 'email_taken'
  | 'email_not_verified'
  | 'wrong_password'
  | 'password_too_short'
  | 'password_too_long'
  | 'password_unchanged'
  | 'password_breached'
  | 'verification_invalid'
  | 'verification_code_invalid'
  | 'reset_invalid'
  | 'validation_failed';

const AUTH_MESSAGES: Record<AuthErrorCode, string> = {
  unauthenticated: 'Not signed in',
  invalid_credentials: 'Wrong email or password',
  account_locked: 'Too many failed sign-ins; the account is locked for a while',
  too_many_requests: 'Too many attempts; try again later',
  email_taken: 'An account with this email already exists',
  email_not_verified: 'The email address has not been confirmed yet',
  wrong_password: 'The current password is wrong',
  password_too_short: 'The password is too short',
  password_too_long: 'The password is too long',
  password_unchanged: 'The new password is the same as the current one',
  password_breached: 'The password is known from data breaches or is too common',
  verification_invalid: 'The confirmation link has expired or was already used',
  verification_code_invalid: 'The confirmation code is wrong, has expired or was tried too often',
  reset_invalid: 'The password link has expired or was already used',
  validation_failed: 'Request validation failed',
};
