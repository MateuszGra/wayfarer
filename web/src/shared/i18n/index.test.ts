import { describe, expect, it } from 'vitest';
import { t } from './index';

describe('t', () => {
  it('returns the Polish text for a key', () => {
    expect(t('nav.map')).toBe('Mapa');
  });

  it('fills in named parameters', () => {
    expect(t('scene.distance', { done: 214, total: 3200 })).toBe('214 z 3200 km');
  });

  it('leaves a placeholder visible when its parameter is missing', () => {
    expect(t('scene.distance', { done: 5 })).toBe('5 z {total} km');
  });
});
