import { NextResponse, type NextRequest } from 'next/server';
import { backendUrl } from '@/api/backend-url';

const API_PREFIX = '/api';

// Same-origin /api/* goes to the backend, so its cookies stay first-party.
export function proxy(request: NextRequest): NextResponse {
  if (isCrossSiteWrite(request)) {
    return forbidden(request.nextUrl.pathname);
  }
  const { pathname, search } = request.nextUrl;
  const target = new URL(backendUrl());
  target.pathname = pathname.slice(API_PREFIX.length);
  target.search = search;
  return NextResponse.rewrite(target);
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
