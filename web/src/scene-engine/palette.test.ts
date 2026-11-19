import { describe, expect, it } from 'vitest';
import { mixColor, paletteAt } from './palette';

describe('paletteAt', () => {
  it('shows a full starry sky at midnight', () => {
    expect(paletteAt(0).stars).toBe(1);
  });

  it('shows no stars at noon', () => {
    expect(paletteAt(12).stars).toBe(0);
  });

  it('is brighter at noon than at midnight', () => {
    expect(paletteAt(12).bright).toBeGreaterThan(paletteAt(0).bright);
  });

  it('uses the keyframe values exactly on a keyframe hour', () => {
    expect(paletteAt(13).top).toBe(0x3374c2);
  });

  it('wraps hours past midnight to the next day', () => {
    expect(paletteAt(25)).toEqual(paletteAt(1));
  });
});

describe('mixColor', () => {
  it('returns the first colour at 0 and the second at 1', () => {
    expect(mixColor(0x000000, 0xffffff, 0)).toBe(0x000000);
    expect(mixColor(0x000000, 0xffffff, 1)).toBe(0xffffff);
  });

  it('blends each channel halfway at 0.5', () => {
    expect(mixColor(0x000000, 0xff8000, 0.5)).toBe(0x804000);
  });

  it('clamps the factor outside 0..1', () => {
    expect(mixColor(0x102030, 0x405060, 2)).toBe(0x405060);
  });
});
