import type { FastifyInstance, FastifyRequest, preHandlerAsyncHookHandler } from 'fastify';
import type { NotificationSettingsDto } from '../../../shared/api/contracts.js';
import {
  changeNotificationSettings,
  notificationSettings,
  type NotificationsDependencies,
} from '../application/notificationSettingsService.js';

export interface NotificationsHttpOptions {
  /** Rejects requests without a signed-in player. */
  readonly signedIn: preHandlerAsyncHookHandler;
  /** The signed-in player's account, from the session (never from the request body or URL). */
  readonly accountOf: (request: FastifyRequest) => string;
}

const settingsSchema = {
  body: {
    type: 'object',
    required: ['stepReminders'],
    additionalProperties: false,
    properties: { stepReminders: { type: 'boolean' } },
  },
} as const;

export function registerNotificationsHttp(
  app: FastifyInstance,
  deps: NotificationsDependencies,
  options: NotificationsHttpOptions,
): void {
  const guarded = { preHandler: options.signedIn };

  app.get('/api/notifications/settings', guarded, async (request): Promise<NotificationSettingsDto> =>
    notificationSettings(deps, options.accountOf(request)),
  );

  app.put<{ Body: NotificationSettingsDto }>(
    '/api/notifications/settings',
    { ...guarded, schema: settingsSchema },
    async (request): Promise<NotificationSettingsDto> =>
      changeNotificationSettings(deps, options.accountOf(request), request.body),
  );
}
