import { describe, expect, it } from 'vitest';
import { t, tn } from './index';

describe('t', () => {
  it('returns the Polish text for a key', () => {
    expect(t('menu.map')).toBe('Mapa');
  });

  it('fills in named parameters', () => {
    expect(t('scene.distance', { done: 214, total: 3200 })).toBe('214 z 3200 km');
  });

  it('leaves a placeholder visible when its parameter is missing', () => {
    expect(t('scene.distance', { done: 5 })).toBe('5 z {total} km');
  });
});

describe('tn', () => {
  it.each([
    { count: 1, text: '1 dzień' },
    { count: 2, text: '2 dni' },
    { count: 5, text: '5 dni' },
    { count: 22, text: '22 dni' },
  ])('says "$text" for $count days', ({ count, text }) => {
    expect(tn('unit.days', count)).toBe(text);
  });

  it.each([
    { count: 1, text: '1 miesiąc' },
    { count: 3, text: '3 miesiące' },
    { count: 14, text: '14 miesięcy' },
    { count: 22, text: '22 miesiące' },
  ])('says "$text" for $count months', ({ count, text }) => {
    expect(tn('unit.months', count)).toBe(text);
  });

  it('groups thousands in Polish style', () => {
    expect(tn('unit.steps', 10_000)).toBe('10\u00a0000 kroków');
  });
});
