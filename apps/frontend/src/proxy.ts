import { NextResponse, type NextRequest } from 'next/server';
import { backendUrl } from '@/api/backend-url';

const API_PREFIX = '/api';

// Same-origin /api/* goes to the backend, so its cookies stay first-party.
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const target = new URL(backendUrl());
  target.pathname = pathname.slice(API_PREFIX.length);
  target.search = search;
  return NextResponse.rewrite(target);
}

export const config = {
  matcher: ['/api/:path*'],
};
