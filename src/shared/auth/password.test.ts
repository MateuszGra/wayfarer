import { describe, expect, it } from 'vitest';
import { existingPasswordError, newPasswordError, passwordRepeatError, passwordUnchangedError } from './password';

describe('existingPasswordError', () => {
  it('asks for a password when it is empty', () => {
    expect(existingPasswordError('')).toBe('passwordRequired');
  });

  it('accepts any non-empty password', () => {
    expect(existingPasswordError('x')).toBeNull();
  });
});

describe('newPasswordError', () => {
  it.each([
    { password: '', error: 'passwordRequired' },
    { password: '1234567', error: 'passwordTooShort' },
    { password: '12345678', error: null },
    { password: '123456789', error: null },
    { password: 'x'.repeat(128), error: null },
    { password: 'x'.repeat(129), error: 'passwordTooLong' },
  ])('returns $error for a password of length $password.length', ({ password, error }) => {
    expect(newPasswordError(password)).toBe(error);
  });
});

describe('passwordRepeatError', () => {
  it('accepts a matching repeat', () => {
    expect(passwordRepeatError('camino2026', 'camino2026')).toBeNull();
  });

  it('rejects a repeat that differs', () => {
    expect(passwordRepeatError('camino2026', 'camino2025')).toBe('passwordMismatch');
  });
});

describe('passwordUnchangedError', () => {
  it('rejects a new password equal to the current one', () => {
    expect(passwordUnchangedError('camino2026', 'camino2026')).toBe('passwordUnchanged');
  });

  it('accepts a new password that differs from the current one', () => {
    expect(passwordUnchangedError('camino2026', 'santiago2026')).toBeNull();
  });
});
