import type { ErrorCode } from '@shared/api/errorCodes';
import type { TranslationKey } from '../i18n';

const MESSAGE_KEYS: Record<ErrorCode, TranslationKey> = {
  not_found: 'errors.not_found',
  validation_failed: 'errors.validation_failed',
  database_unavailable: 'errors.database_unavailable',
  internal_error: 'errors.internal_error',
};

export function errorMessageKey(code: string | null): TranslationKey {
  if (code === null) return 'errors.network';
  return code in MESSAGE_KEYS ? MESSAGE_KEYS[code as ErrorCode] : 'errors.unknown';
}
