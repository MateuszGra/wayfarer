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
  const path = [
    [18.6, 54.3],
    [-8.5, 42.9],
  ] as const;

  it.each([0, -10])('throws when the length is %s km', (lengthKm) => {
    expect(() => createRoute(routeId('test-route'), lengthKm, path)).toThrow(RangeError);
  });

  it('throws when the path has only one point', () => {
    expect(() => createRoute(routeId('test-route'), 10, [[18.6, 54.3]])).toThrow(RangeError);
  });

  it.each([[[181, 0]], [[0, -91]]] as const)('throws for the point %j', (point) => {
    expect(() => createRoute(routeId('test-route'), 10, [point, [0, 0]])).toThrow(RangeError);
  });
});
