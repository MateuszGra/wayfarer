// Deliberately loose: an address is proven only by mail reaching it; this catches typos.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_EMAIL_LENGTH = 254;

export type EmailError = 'emailInvalid';

export function emailError(email: string): EmailError | null {
  const trimmed = email.trim();
  return trimmed.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(trimmed) ? null : 'emailInvalid';
}

/** The form an address is stored and compared in, so `Ana@Example.com ` and `ana@example.com` are one account. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
