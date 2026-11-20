export const MIN_PASSWORD_LENGTH = 8;
// Every character is allowed, but hashing very long input costs the server, so there is a ceiling.
export const MAX_PASSWORD_LENGTH = 128;

export type PasswordError =
  'passwordRequired' | 'passwordTooShort' | 'passwordTooLong' | 'passwordMismatch' | 'passwordUnchanged';

/** A password the player already has, at sign-in or to confirm a change: it only has to be filled in. */
export function existingPasswordError(password: string): PasswordError | null {
  return password.length === 0 ? 'passwordRequired' : null;
}

export function newPasswordError(password: string): PasswordError | null {
  if (password.length === 0) return 'passwordRequired';
  if (password.length < MIN_PASSWORD_LENGTH) return 'passwordTooShort';
  return password.length > MAX_PASSWORD_LENGTH ? 'passwordTooLong' : null;
}

export function passwordRepeatError(password: string, repeat: string): PasswordError | null {
  return password === repeat ? null : 'passwordMismatch';
}

export function passwordUnchangedError(current: string, next: string): PasswordError | null {
  return current === next ? 'passwordUnchanged' : null;
}
