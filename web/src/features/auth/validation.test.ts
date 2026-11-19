import { describe, expect, it } from 'vitest';
import { emailError, loginPasswordError, newPasswordError, passwordRepeatError } from './validation';

describe('emailError', () => {
  it.each(['wanderer@example.com', '  wanderer@example.pl  '])('accepts "%s"', (email) => {
    expect(emailError(email)).toBeNull();
  });

  it.each(['', 'wanderer', 'wanderer@', 'wanderer@example', 'wan derer@example.com'])('rejects "%s"', (email) => {
    expect(emailError(email)).toBe('emailInvalid');
  });
});

describe('loginPasswordError', () => {
  it('asks for a password when it is empty', () => {
    expect(loginPasswordError('')).toBe('passwordRequired');
  });

  it('accepts any non-empty password when signing in', () => {
    expect(loginPasswordError('x')).toBeNull();
  });
});

describe('newPasswordError', () => {
  it.each([
    { password: '', error: 'passwordRequired' },
    { password: '1234567', error: 'passwordTooShort' },
    { password: '12345678', error: null },
    { password: '123456789', error: null },
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
