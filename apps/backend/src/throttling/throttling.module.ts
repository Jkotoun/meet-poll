import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { normalizeIp, ThrottlerModule } from '@nestjs/throttler';
import type { Request } from 'express';
import { Environment } from '../config/environment.js';
import { normalizeEmail } from '../users/users.api.js';
import { clientIp } from './client-ip.js';
import {
  LOGIN_PER_EMAIL,
  LOGIN_PER_IP,
  PER_EMAIL,
  PER_IP,
} from './rate-limits.js';

function emailOf(request: Request): string | undefined {
  const email: unknown = request.body?.email;
  return typeof email === 'string' ? normalizeEmail(email) : undefined;
}

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => {
        const proxySecret = config.get('PROXY_SECRET', { infer: true });
        return {
          setHeaders: false,
          throttlers: [
            {
              name: PER_IP,
              ...LOGIN_PER_IP,
              // Groups IPv6 clients by /64, as one host can rotate within it.
              getTracker: (request) =>
                normalizeIp(clientIp(request as Request, proxySecret)),
            },
            {
              name: PER_EMAIL,
              ...LOGIN_PER_EMAIL,
              getTracker: (request) => emailOf(request as Request) ?? '',
              skipIf: (context) =>
                !emailOf(context.switchToHttp().getRequest<Request>()),
            },
          ],
        };
      },
    }),
  ],
})
export class ThrottlingModule {}
