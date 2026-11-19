import { describe, expect, it } from 'vitest';
import { createRoute, routeId } from './route.js';

describe('routeId', () => {
  it('accepts a kebab-case id', () => {
    expect(routeId('baltic-santiago')).toBe('baltic-santiago');
  });

  it.each(['', 'Baltic', 'baltic_santiago', '-baltic', 'baltic-'])('throws for "%s"', (value) => {
    expect(() => routeId(value)).toThrow(RangeError);
  });
});

describe('createRoute', () => {
  it.each([0, -10])('throws when the length is %s km', (lengthKm) => {
    expect(() => createRoute(routeId('test-route'), lengthKm)).toThrow(RangeError);
  });
});
