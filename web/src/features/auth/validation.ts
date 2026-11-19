export const MIN_PASSWORD_LENGTH = 8;

export type AuthFieldError = 'emailInvalid' | 'passwordRequired' | 'passwordTooShort' | 'passwordMismatch';

// Deliberately loose: the server confirms the address by sending an email; this only catches typos.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailError(email: string): AuthFieldError | null {
  return EMAIL_PATTERN.test(email.trim()) ? null : 'emailInvalid';
}

export function loginPasswordError(password: string): AuthFieldError | null {
  return password.length === 0 ? 'passwordRequired' : null;
}

export function newPasswordError(password: string): AuthFieldError | null {
  if (password.length === 0) return 'passwordRequired';
  return password.length < MIN_PASSWORD_LENGTH ? 'passwordTooShort' : null;
}

export function passwordRepeatError(password: string, repeat: string): AuthFieldError | null {
  return password === repeat ? null : 'passwordMismatch';
}
