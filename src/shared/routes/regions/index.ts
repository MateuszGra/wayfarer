import type { Region } from '../landscape.js';
import { BALTIC_SANTIAGO_REGIONS, BALTIC_SANTIAGO_SEED } from './balticSantiago.js';

/** The regions of each route and the seed its landscapes are drawn from. */
export const ROUTE_REGIONS: Readonly<Record<string, { readonly regions: readonly Region[]; readonly seed: number }>> = {
  'baltic-santiago': { regions: BALTIC_SANTIAGO_REGIONS, seed: BALTIC_SANTIAGO_SEED },
};
