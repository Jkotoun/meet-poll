import { describe, expect, it } from 'bun:test';
import type { Request } from 'express';
import { clientIp } from './client-ip.js';

const secret = 's'.repeat(32);

function requestWith(
  headers: Record<string, string>,
  remoteAddress = '10.0.0.1',
): Request {
  return {
    header: (name: string) => headers[name.toLowerCase()],
    socket: { remoteAddress },
  } as unknown as Request;
}

describe('clientIp', () => {
  it('trusts the client IP forwarded by the frontend proxy', () => {
    const request = requestWith({
      'x-proxy-secret': secret,
      'x-client-ip': '203.0.113.7',
      'x-forwarded-for': '198.51.100.1',
    });

    expect(clientIp(request, secret)).toBe('203.0.113.7');
  });

  it('ignores a forwarded client IP with a wrong secret of the same length', () => {
    const request = requestWith({
      'x-proxy-secret': 'w'.repeat(32),
      'x-client-ip': '203.0.113.7',
      'x-forwarded-for': '198.51.100.1',
    });

    expect(clientIp(request, secret)).toBe('198.51.100.1');
  });

  it('ignores a forwarded client IP without any secret', () => {
    const request = requestWith({ 'x-client-ip': '203.0.113.7' });

    expect(clientIp(request, secret)).toBe('10.0.0.1');
  });

  it('uses the last X-Forwarded-For hop when the proxy names no client', () => {
    const request = requestWith({
      'x-proxy-secret': secret,
      'x-forwarded-for': '1.2.3.4, 198.51.100.1',
    });

    expect(clientIp(request, secret)).toBe('198.51.100.1');
  });

  it('falls back to the socket address', () => {
    expect(clientIp(requestWith({}), secret)).toBe('10.0.0.1');
  });
});
