import { describe, expect, it } from 'vitest';
import { emailError, normalizeEmail } from './email';

describe('emailError', () => {
  it.each(['wanderer@example.com', '  wanderer@example.pl  '])('accepts "%s"', (email) => {
    expect(emailError(email)).toBeNull();
  });

  it.each(['', 'wanderer', 'wanderer@', 'wanderer@example', 'wan derer@example.com'])('rejects "%s"', (email) => {
    expect(emailError(email)).toBe('emailInvalid');
  });

  it('accepts an address of exactly 254 characters', () => {
    expect(emailError(`${'a'.repeat(242)}@example.com`)).toBeNull();
  });

  it('rejects an address longer than 254 characters', () => {
    expect(emailError(`${'a'.repeat(243)}@example.com`)).toBe('emailInvalid');
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases an address', () => {
    expect(normalizeEmail('  Ana@Example.COM ')).toBe('ana@example.com');
  });
});
