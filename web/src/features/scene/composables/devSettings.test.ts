import { beforeEach, describe, expect, it } from 'vitest';
import { loadDevSettings, NO_DEV_SETTINGS, saveDevSettings } from './devSettings';

beforeEach(() => {
  localStorage.clear();
});

describe('developer settings', () => {
  it('come back after a reload as they were saved', () => {
    const settings = { ...NO_DEV_SETTINGS, hour: 20.3, biome: 'forest', walkMode: 'fullDay' as const };
    saveDevSettings(settings);

    expect(loadDevSettings()).toEqual(settings);
  });

  it('start afresh when nothing was saved', () => {
    expect(loadDevSettings()).toEqual(NO_DEV_SETTINGS);
  });

  it('start afresh when what is stored cannot be read', () => {
    localStorage.setItem('wayfarer.devSettings', '{not json');

    expect(loadDevSettings()).toEqual(NO_DEV_SETTINGS);
  });

  it('fill in a setting added since they were saved', () => {
    localStorage.setItem('wayfarer.devSettings', JSON.stringify({ biome: 'meseta' }));

    expect(loadDevSettings()).toEqual({ ...NO_DEV_SETTINGS, biome: 'meseta' });
  });
});
