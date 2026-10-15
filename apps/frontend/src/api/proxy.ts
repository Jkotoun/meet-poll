const API_PREFIX = '/api';
const UPSTREAM_TIMEOUT_MS = 30_000;

// Connection-level headers; fetch decompresses bodies, so encodings and lengths go too.
const REQUEST_HEADERS_TO_DROP = [
  'accept-encoding',
  'connection',
  'content-length',
  'forwarded',
  'host',
  'keep-alive',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];
const RESPONSE_HEADERS_TO_DROP = [
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'transfer-encoding',
];

export async function proxyToBackend(
  request: Request,
  backend: URL,
  timeoutMs = UPSTREAM_TIMEOUT_MS,
): Promise<Response> {
  const incoming = new URL(request.url);
  const target = new URL(backend);
  target.pathname = incoming.pathname.slice(API_PREFIX.length);
  target.search = incoming.search;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers: forwardedHeaders(request, incoming),
      body: hasBody(request.method) ? request.body : undefined,
      redirect: 'manual',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(timeoutMs)]),
    });
  } catch (error) {
    if (request.signal.aborted) {
      return problem(502, 'Bad Gateway', incoming.pathname);
    }
    console.error(`Proxy ${request.method} ${target.pathname} failed`, error);
    const timedOut =
      error instanceof DOMException && error.name === 'TimeoutError';
    return timedOut
      ? problem(504, 'Gateway Timeout', incoming.pathname)
      : problem(502, 'Bad Gateway', incoming.pathname);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: withoutHeaders(upstream.headers, RESPONSE_HEADERS_TO_DROP),
  });
}

// request.url carries the server's bind address, so the public host comes from the headers.
function forwardedHeaders(request: Request, incoming: URL): Headers {
  const headers = withoutHeaders(request.headers, REQUEST_HEADERS_TO_DROP);
  headers.set('x-forwarded-host', request.headers.get('host') ?? incoming.host);
  headers.set(
    'x-forwarded-proto',
    request.headers.get('x-forwarded-proto') ??
      incoming.protocol.replace(':', ''),
  );
  return headers;
}

function hasBody(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD';
}

function withoutHeaders(source: Headers, names: string[]): Headers {
  const headers = new Headers(source);
  for (const name of names) {
    headers.delete(name);
  }
  return headers;
}

function problem(status: number, title: string, instance: string): Response {
  return Response.json(
    { type: 'about:blank', title, status, instance },
    { status, headers: { 'content-type': 'application/problem+json' } },
  );
}
