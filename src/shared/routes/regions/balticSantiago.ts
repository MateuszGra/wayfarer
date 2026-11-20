import type { Region } from '../landscape.js';

// Baltic → Santiago, 3,200 km, cut by the towns the route passes (see the routes module) and the biome map
// in the wayfarer-biomes skill. Where a region's own biome doesn't exist yet, the nearest finished one
// stands in (noted per region), to be swapped as those biomes are built.
export const BALTIC_SANTIAGO_SEED = 2026;

export const BALTIC_SANTIAGO_REGIONS: readonly Region[] = [
  // The journey starts on the beach at Gdańsk.
  { id: 'gdanskCoast', fromKm: 0, toKm: 24, mix: [{ biome: 'baltic', weight: 1 }] },
  {
    id: 'pomeranianCoast',
    fromKm: 24,
    toKm: 56,
    mix: [
      { biome: 'baltic', weight: 6 },
      { biome: 'fields', weight: 2.5 },
      { biome: 'forest', weight: 1.5, levels: ['low'] },
    ],
  },
  // Kociewie and the lower Vistula towards Toruń: lakes stand in for the river valley and the Żuławy.
  {
    id: 'lowerVistula',
    fromKm: 56,
    toKm: 168,
    mix: [
      { biome: 'lakes', weight: 5 },
      { biome: 'fields', weight: 3 },
      { biome: 'forest', weight: 2, levels: ['low'] },
    ],
  },
  {
    id: 'kuyaviaGreaterPoland',
    fromKm: 168,
    toKm: 319,
    mix: [
      { biome: 'fields', weight: 7 },
      { biome: 'lakes', weight: 1.5 },
      { biome: 'forest', weight: 1.5, levels: ['low'] },
    ],
  },
  // Lubusz: pine forests and lakes towards Zielona Góra.
  {
    id: 'lubusz',
    fromKm: 319,
    toKm: 443,
    mix: [
      { biome: 'forest', weight: 4.5, levels: ['low'] },
      { biome: 'fields', weight: 3.5 },
      { biome: 'lakes', weight: 2 },
    ],
  },
  // Lower Silesia and the Sudetes foothills (stand-in: wooded hills, a few low mountains).
  {
    id: 'lowerSilesia',
    fromKm: 443,
    toKm: 550,
    mix: [
      { biome: 'forest', weight: 4, levels: ['low', 'mid'] },
      { biome: 'fields', weight: 4 },
      { biome: 'mountains', weight: 2, levels: ['low'] },
    ],
  },
  // Saxony and Thuringia: broadleaf forest and villages (stand-in: beech forest and fields).
  {
    id: 'saxonyThuringia',
    fromKm: 550,
    toKm: 877,
    mix: [
      { biome: 'forest', weight: 5.5, levels: ['low', 'mid'] },
      { biome: 'fields', weight: 4.5 },
    ],
  },
  // Hesse and Franconia: river valleys (stand-in: lakes for the rivers).
  {
    id: 'hesse',
    fromKm: 877,
    toKm: 1095,
    mix: [
      { biome: 'forest', weight: 5, levels: ['low', 'mid'] },
      { biome: 'fields', weight: 3.5 },
      { biome: 'lakes', weight: 1.5 },
    ],
  },
  // Rhineland and Lorraine: vineyards above the rivers (stand-in: fields and lakes).
  {
    id: 'rhinelandLorraine',
    fromKm: 1095,
    toKm: 1335,
    mix: [
      { biome: 'fields', weight: 5 },
      { biome: 'forest', weight: 3, levels: ['low', 'mid'] },
      { biome: 'lakes', weight: 2 },
    ],
  },
  // Burgundy: hedgerows, stone villages and abbeys (stand-in: fields).
  {
    id: 'burgundy',
    fromKm: 1335,
    toKm: 1651,
    mix: [
      { biome: 'fields', weight: 7 },
      { biome: 'forest', weight: 3, levels: ['low'] },
    ],
  },
  // Massif Central: volcanic uplands (stand-in: high beech forest and low mountains).
  {
    id: 'massifCentral',
    fromKm: 1651,
    toKm: 1955,
    mix: [
      { biome: 'forest', weight: 4, levels: ['mid', 'high'] },
      { biome: 'mountains', weight: 3, levels: ['low', 'mid'] },
      { biome: 'fields', weight: 3 },
    ],
  },
  // Aubrac: a windy high plateau of pastures and granite (stand-in: fields, the odd low mountain).
  {
    id: 'aubrac',
    fromKm: 1955,
    toKm: 2099,
    mix: [
      { biome: 'fields', weight: 6 },
      { biome: 'mountains', weight: 2, levels: ['low'] },
      { biome: 'forest', weight: 2, levels: ['mid'] },
    ],
  },
  // Lot valley and Gascony: limestone, medieval towns, sunflowers (stand-in: fields and woods).
  {
    id: 'gascony',
    fromKm: 2099,
    toKm: 2483,
    mix: [
      { biome: 'fields', weight: 6 },
      { biome: 'forest', weight: 3, levels: ['low'] },
      { biome: 'meseta', weight: 1 },
    ],
  },
  {
    id: 'pyrenees',
    fromKm: 2483,
    toKm: 2540,
    mix: [
      { biome: 'mountains', weight: 7, levels: ['mid', 'high'] },
      { biome: 'forest', weight: 3, levels: ['high'] },
    ],
  },
  // Navarre and La Rioja: red earth and vines (stand-in: the meseta and fields).
  {
    id: 'navarreRioja',
    fromKm: 2540,
    toKm: 2744,
    mix: [
      { biome: 'meseta', weight: 5 },
      { biome: 'fields', weight: 5 },
    ],
  },
  {
    id: 'castile',
    fromKm: 2744,
    toKm: 2920,
    mix: [
      { biome: 'meseta', weight: 8.5 },
      { biome: 'fields', weight: 1.5 },
    ],
  },
  // Montes de León and El Bierzo: heath, chestnuts, slate roofs (stand-in: low mountains and woods).
  {
    id: 'leonMountains',
    fromKm: 2920,
    toKm: 3015,
    mix: [
      { biome: 'mountains', weight: 5, levels: ['low', 'mid'] },
      { biome: 'forest', weight: 3, levels: ['mid'] },
      { biome: 'meseta', weight: 2 },
    ],
  },
  // Green Galicia: mist, moss and stone granaries (stand-in: low beech forest and fields).
  {
    id: 'galicia',
    fromKm: 3015,
    toKm: 3200,
    mix: [
      { biome: 'forest', weight: 7, levels: ['low'] },
      { biome: 'fields', weight: 3 },
    ],
  },
];
