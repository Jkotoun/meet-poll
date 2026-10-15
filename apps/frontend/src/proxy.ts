import { NextResponse, type NextRequest } from 'next/server';
import { backendConfig } from '@/api/backend-config';

const API_PREFIX = '/api';

// Same-origin /api/* goes to the backend, so its cookies stay first-party.
export function proxy(request: NextRequest): NextResponse {
  if (isCrossSiteWrite(request)) {
    return forbidden(request.nextUrl.pathname);
  }
  const backend = backendConfig();
  const { pathname, search } = request.nextUrl;
  const target = new URL(backend.url);
  target.pathname = pathname.slice(API_PREFIX.length);
  target.search = search;
  return NextResponse.rewrite(target, {
    request: { headers: forwardedHeaders(request, backend.proxySecret) },
  });
}

// The backend trusts x-client-ip only with the secret, so clients can't name themselves.
function forwardedHeaders(request: NextRequest, proxySecret: string): Headers {
  const headers = new Headers(request.headers);
  headers.delete('x-client-ip');
  headers.set('x-proxy-secret', proxySecret);
  const clientIp = lastForwardedHop(request.headers);
  if (clientIp) {
    headers.set('x-client-ip', clientIp);
  }
  return headers;
}

// Google's front end appends the caller's address; earlier hops come from the client.
function lastForwardedHop(headers: Headers): string | undefined {
  const hops = headers.get('x-forwarded-for')?.split(',') ?? [];
  return hops.at(-1)?.trim() || undefined;
}

// SameSite=Lax still lets cross-site top-level form POSTs through.
function isCrossSiteWrite(request: NextRequest): boolean {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return false;
  }
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite) {
    return fetchSite !== 'same-origin';
  }
  const origin = request.headers.get('origin');
  return origin !== null && originHost(origin) !== request.headers.get('host');
}

// Opaque origins (`Origin: null`) don't parse and count as cross-site.
function originHost(origin: string): string | undefined {
  return URL.canParse(origin) ? new URL(origin).host : undefined;
}

function forbidden(instance: string): NextResponse {
  return NextResponse.json(
    { type: 'about:blank', title: 'Forbidden', status: 403, instance },
    { status: 403, headers: { 'content-type': 'application/problem+json' } },
  );
}

export const config = {
  matcher: ['/api/:path*'],
};
