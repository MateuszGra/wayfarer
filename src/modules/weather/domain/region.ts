/** A place the weather is fetched for: a town or a city district, never a precise location. */
export interface Region {
  readonly id: string;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
}

// Until the region comes from the player's IP address (see docs/brief.md), every player gets the weather
// of Słupsk.
export const DEFAULT_REGION: Region = { id: 'pl-slupsk', name: 'Słupsk', latitude: 54.46, longitude: 17.03 };
