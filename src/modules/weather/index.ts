// Public API of the weather module. Other modules and the server import only from here.
export { createWeatherService, type WeatherService, WEATHER_TTL_MS } from './application/weatherService.js';
export { WeatherError } from './domain/errors.js';
export type { Observation, WeatherSource } from './domain/ports.js';
export { DEFAULT_REGION, type Region } from './domain/region.js';
export { createOpenMeteo } from './infrastructure/openMeteo.js';
export { registerWeatherHttp } from './infrastructure/weatherHttp.js';
