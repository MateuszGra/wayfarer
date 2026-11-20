import type { ErrorCode } from '@shared/api/errorCodes';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@shared/auth/password';
import { ApiRequestError } from './client';
import { t, type TranslationKey } from '../i18n';

const MESSAGE_KEYS: Record<ErrorCode, TranslationKey> = {
  not_found: 'errors.not_found',
  validation_failed: 'errors.validation_failed',
  database_unavailable: 'errors.database_unavailable',
  internal_error: 'errors.internal_error',
  unauthenticated: 'errors.unauthenticated',
  invalid_credentials: 'errors.invalid_credentials',
  account_locked: 'errors.account_locked',
  too_many_requests: 'errors.too_many_requests',
  email_taken: 'errors.email_taken',
  wrong_password: 'errors.wrong_password',
  password_too_short: 'errors.password_too_short',
  password_too_long: 'errors.password_too_long',
  password_unchanged: 'errors.password_unchanged',
  password_breached: 'errors.password_breached',
  journey_not_found: 'errors.journey_not_found',
  journey_exists: 'errors.journey_exists',
  unknown_route: 'errors.unknown_route',
  invalid_steps: 'errors.invalid_steps',
  weather_unavailable: 'errors.weather_unavailable',
};

export function errorMessageKey(code: string | null): TranslationKey {
  if (code === null) return 'errors.network';
  return code in MESSAGE_KEYS ? MESSAGE_KEYS[code as ErrorCode] : 'errors.unknown';
}

/** UI text for a failed call: by error code for API errors, a network message when the call never arrived. */
export function apiErrorMessage(error: unknown): string {
  const code = error instanceof ApiRequestError ? error.code : 'unknown';
  return t(errorMessageKey(code), { min: MIN_PASSWORD_LENGTH, max: MAX_PASSWORD_LENGTH });
}
