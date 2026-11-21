import { describe, expect, it } from 'vitest';
import { formatVerificationCode, normalizeVerificationCode } from './verificationCode';

describe('normalizeVerificationCode', () => {
  it.each([
    ['482917', '482917'],
    ['482-917', '482917'],
    [' 482 917 ', '482917'],
    ['000123', '000123'],
  ])('reads "%s" as %s', (input, digits) => {
    expect(normalizeVerificationCode(input)).toBe(digits);
  });

  it.each(['', '48291', '4829170', 'abc-def', '48-29-1'])('rejects "%s"', (input) => {
    expect(normalizeVerificationCode(input)).toBeNull();
  });
});

describe('formatVerificationCode', () => {
  it('splits the six digits into two groups of three', () => {
    expect(formatVerificationCode('482917')).toBe('482-917');
  });

  it('keeps leading zeros', () => {
    expect(formatVerificationCode('000123')).toBe('000-123');
  });
});
