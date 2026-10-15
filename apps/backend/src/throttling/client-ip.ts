import { timingSafeEqual } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type { Request } from 'express';

export const PROXY_SECRET_HEADER = 'x-proxy-secret';
export const CLIENT_IP_HEADER = 'x-client-ip';

const logger = new Logger('ClientIp');

// Only the frontend proxy (shared secret) can name the client; otherwise use the
// last X-Forwarded-For hop, which Google's front end appends.
export function clientIp(request: Request, proxySecret: string): string {
  const forwardedClientIp = request.header(CLIENT_IP_HEADER);
  if (forwardedClientIp && isTrustedProxy(request, proxySecret)) {
    return forwardedClientIp;
  }
  if (forwardedClientIp) {
    logger.warn('Ignoring x-client-ip without a valid proxy secret');
  }
  return lastForwardedHop(request) ?? request.socket.remoteAddress ?? 'unknown';
}

function isTrustedProxy(request: Request, proxySecret: string): boolean {
  const presented = Buffer.from(request.header(PROXY_SECRET_HEADER) ?? '');
  const expected = Buffer.from(proxySecret);
  return (
    presented.length === expected.length && timingSafeEqual(presented, expected)
  );
}

function lastForwardedHop(request: Request): string | undefined {
  const hops = request.header('x-forwarded-for')?.split(',') ?? [];
  return hops.at(-1)?.trim() || undefined;
}
