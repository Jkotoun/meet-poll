import 'server-only';
import { cookies } from 'next/headers';
import { backendUrl } from './backend-url';
import { createApiClient } from './client';

const TIMEOUT_MS = 5_000;

// Calls the backend directly on the visitor's behalf, with their cookies.
// Create one per request: the timeout starts here.
export async function serverApi() {
  return createApiClient(backendUrl().origin, {
    headers: { cookie: (await cookies()).toString() },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}
