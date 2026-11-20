import type { FastifyInstance, preHandlerAsyncHookHandler } from 'fastify';
import type { WeatherResponse } from '../../../shared/api/contracts.js';
import type { WeatherService } from '../application/weatherService.js';
import { DEFAULT_REGION } from '../domain/region.js';

export interface WeatherHttpOptions {
  readonly signedIn: preHandlerAsyncHookHandler;
}

export function registerWeatherHttp(app: FastifyInstance, weather: WeatherService, options: WeatherHttpOptions): void {
  app.get('/api/weather', { preHandler: options.signedIn }, async (): Promise<WeatherResponse> =>
    weather.current(DEFAULT_REGION),
  );
}
