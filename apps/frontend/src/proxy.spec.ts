import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

const PROXY_SECRET = 's'.repeat(32);

// Next passes headers set on the rewritten request as x-middleware-request-<name>.
function forwardedHeader(response: Response, name: string): string | null {
  return response.headers.get(`x-middleware-request-${name}`);
}

function request(
  path: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(`http://meet-poll.test${path}`, init);
}

function rewriteTarget(path: string): string | null {
  return proxy(request(path)).headers.get('x-middleware-rewrite');
}

function write(headers: Record<string, string>) {
  return proxy(
    request('/api/v1/auth/login', {
      method: 'POST',
      headers: { host: 'meet-poll.test', ...headers },
      body: '{}',
    }),
  );
}

describe('proxy', () => {
  const original = {
    BACKEND_URL: process.env.BACKEND_URL,
    PROXY_SECRET: process.env.PROXY_SECRET,
  };

  beforeEach(() => {
    process.env.BACKEND_URL = 'https://backend.test';
    process.env.PROXY_SECRET = PROXY_SECRET;
  });

  afterEach(() => {
    for (const [name, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });

  it('forwards /api/* to the backend without the prefix, keeping the query', () => {
    expect(rewriteTarget('/api/v1/events?limit=5')).toBe(
      'https://backend.test/v1/events?limit=5',
    );
  });

  it('keeps a protocol-relative path on the backend host', () => {
    expect(rewriteTarget('/api//evil.test/steal')).toStartWith(
      'https://backend.test/',
    );
  });

  it.each([
    ['a cross-site fetch', { 'sec-fetch-site': 'cross-site' }],
    [
      'a same-site fetch from another subdomain',
      { 'sec-fetch-site': 'same-site' },
    ],
    [
      'a foreign Origin without Fetch Metadata',
      { origin: 'https://evil.test' },
    ],
    ['an opaque Origin', { origin: 'null' }],
  ])('refuses writes from %s', async (_case, headers) => {
    const response = write(headers);

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      title: 'Forbidden',
      status: 403,
    });
  });

  it.each([
    ['a same-origin fetch', { 'sec-fetch-site': 'same-origin' }],
    ['a matching Origin', { origin: 'https://meet-poll.test' }],
    ['a client without Origin or Fetch Metadata', {}],
  ])('allows writes from %s', (_case, headers) => {
    expect(write(headers).headers.get('x-middleware-rewrite')).toBe(
      'https://backend.test/v1/auth/login',
    );
  });

  it('vouches for the client IP Google appended, not ones the client sent', () => {
    const response = proxy(
      request('/api/v1/events', {
        headers: {
          'x-forwarded-for': '1.2.3.4, 203.0.113.7',
          'x-client-ip': '6.6.6.6',
          'x-proxy-secret': 'forged',
        },
      }),
    );

    expect(forwardedHeader(response, 'x-client-ip')).toBe('203.0.113.7');
    expect(forwardedHeader(response, 'x-proxy-secret')).toBe(PROXY_SECRET);
  });

  it('never forwards a client-supplied client IP', () => {
    const response = proxy(
      request('/api/v1/events', { headers: { 'x-client-ip': '6.6.6.6' } }),
    );

    expect(forwardedHeader(response, 'x-client-ip')).toBeNull();
  });

  it('allows cross-site reads', () => {
    const response = proxy(
      request('/api/v1/events', {
        headers: { 'sec-fetch-site': 'cross-site' },
      }),
    );

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://backend.test/v1/events',
    );
  });

  it('sends visitors without a session to log in, keeping where they were going', () => {
    const response = proxy(request('/account?tab=profile'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toEndWith(
      '/login?next=%2Faccount%3Ftab%3Dprofile',
    );
  });

  it('lets visitors with a session cookie through to protected pages', () => {
    const response = proxy(
      request('/account', { headers: { cookie: 'session=token' } }),
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});
