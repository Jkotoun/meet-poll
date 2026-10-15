import { afterAll, beforeAll, describe, expect, it, spyOn } from 'bun:test';
import type { Server } from 'bun';
import { proxyToBackend } from './proxy';

interface Echo {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

const UNREACHABLE_BACKEND = new URL('http://127.0.0.1:1');

async function echo(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const body: Echo = {
    method: request.method,
    url: url.pathname + url.search,
    headers: Object.fromEntries(request.headers),
    body: await request.text(),
  };
  return Response.json(body, { status: 202 });
}

describe('proxyToBackend', () => {
  let upstream: Server<undefined>;
  let backend: URL;

  beforeAll(() => {
    upstream = Bun.serve({
      port: 0,
      routes: {
        '/v1/session': () => {
          const headers = new Headers();
          headers.append('set-cookie', 'session=abc; HttpOnly; Path=/');
          headers.append('set-cookie', 'theme=dark; Path=/');
          return new Response(null, { status: 204, headers });
        },
        '/v1/compressed': () =>
          new Response(Bun.gzipSync('hello'), {
            headers: { 'content-encoding': 'gzip' },
          }),
        '/v1/slow': async () => {
          await Bun.sleep(1_000);
          return new Response('too late');
        },
      },
      fetch: echo,
    });
    backend = new URL(upstream.url);
  });

  afterAll(async () => {
    await upstream.stop(true);
  });

  function proxy(path: string, init?: RequestInit): Promise<Response> {
    return proxyToBackend(
      new Request(`http://0.0.0.0:8080${path}`, init),
      backend,
    );
  }

  it('forwards method, path without the /api prefix, query and body', async () => {
    const response = await proxy('/api/v1/events?limit=5', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: 'session=abc' },
      body: '{"title":"Standup"}',
    });

    expect(response.status).toBe(202);
    const received = (await response.json()) as Echo;
    expect(received).toMatchObject({
      method: 'POST',
      url: '/v1/events?limit=5',
      body: '{"title":"Standup"}',
    });
    expect(received.headers).toMatchObject({
      'content-type': 'application/json',
      cookie: 'session=abc',
      host: backend.host,
    });
  });

  it('forwards the public host and protocol, not the bind address', async () => {
    const response = await proxy('/api/v1/events', {
      headers: {
        host: 'meet-poll.test',
        'x-forwarded-host': 'evil.test',
        'x-forwarded-proto': 'https',
      },
    });

    const received = (await response.json()) as Echo;
    expect(received.headers).toMatchObject({
      'x-forwarded-host': 'meet-poll.test',
      'x-forwarded-proto': 'https',
    });
  });

  it('drops client-supplied Forwarded headers', async () => {
    const response = await proxy('/api/v1/events', {
      headers: { forwarded: 'host=evil.test' },
    });

    const received = (await response.json()) as Echo;
    expect(received.headers.forwarded).toBeUndefined();
  });

  it('passes every Set-Cookie back unchanged', async () => {
    const response = await proxy('/api/v1/session', { method: 'POST' });

    expect(response.status).toBe(204);
    expect(response.headers.getSetCookie()).toEqual([
      'session=abc; HttpOnly; Path=/',
      'theme=dark; Path=/',
    ]);
  });

  it('returns decompressed bodies without the upstream encoding', async () => {
    const response = await proxy('/api/v1/compressed');

    expect(response.headers.get('content-encoding')).toBeNull();
    expect(await response.text()).toBe('hello');
  });

  it('keeps a protocol-relative path on the backend host', async () => {
    const response = await proxy('/api//evil.test/steal');

    const received = (await response.json()) as Echo;
    expect(received.headers.host).toBe(backend.host);
  });

  it('returns a 502 problem when the backend is unreachable', async () => {
    const response = await proxyToBackend(
      new Request('http://0.0.0.0:8080/api/v1/events'),
      UNREACHABLE_BACKEND,
    );

    expect(response.status).toBe(502);
    expect(response.headers.get('content-type')).toBe(
      'application/problem+json',
    );
    expect(await response.json()).toEqual({
      type: 'about:blank',
      title: 'Bad Gateway',
      status: 502,
      instance: '/api/v1/events',
    });
  });

  it('does not log a client that disconnected', async () => {
    const client = new AbortController();
    const errors: unknown[] = [];
    const consoleError = spyOn(console, 'error').mockImplementation((error) => {
      errors.push(error);
    });

    const pending = proxyToBackend(
      new Request('http://0.0.0.0:8080/api/v1/slow', { signal: client.signal }),
      backend,
    );
    client.abort();
    await pending;

    consoleError.mockRestore();
    expect(errors).toEqual([]);
  });

  it('returns a 504 problem when the backend is too slow', async () => {
    const response = await proxyToBackend(
      new Request('http://0.0.0.0:8080/api/v1/slow'),
      backend,
      50,
    );

    expect(response.status).toBe(504);
    expect(await response.json()).toMatchObject({ title: 'Gateway Timeout' });
  });
});
