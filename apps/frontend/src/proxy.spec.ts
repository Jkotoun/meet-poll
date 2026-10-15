import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

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
  const original = process.env.BACKEND_URL;

  beforeEach(() => {
    process.env.BACKEND_URL = 'https://backend.test';
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.BACKEND_URL;
    } else {
      process.env.BACKEND_URL = original;
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
});
