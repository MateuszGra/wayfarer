import { describe, expect, it } from 'vitest';
import { uuidv7 } from './uuidv7';

describe('uuidv7', () => {
  it('is a version 7, RFC 9562 variant UUID', () => {
    expect(uuidv7(new Date('2026-11-20T10:00:00Z'))).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('starts with the creation time in milliseconds', () => {
    // 2026-11-20T10:00:00Z is 1795168800000 ms, 0x01a1f8660d00.
    expect(uuidv7(new Date('2026-11-20T10:00:00Z')).replace('-', '').slice(0, 12)).toBe('01a1f8660d00');
  });

  it('sorts later ids after earlier ones', () => {
    expect(uuidv7(new Date(1795168800000)) < uuidv7(new Date(1795168800001))).toBe(true);
  });
});
