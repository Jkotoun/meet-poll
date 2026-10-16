import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { backendUrl } from '@/api/backend-url';
import { createApiClient } from '@/api/client';
import type { User } from './session';

const SESSION_COOKIE = 'session';
const ME_TIMEOUT_MS = 5_000;

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = (await cookies()).get(SESSION_COOKIE);
  if (!session) {
    return null;
  }
  const api = createApiClient(backendUrl().origin);
  const { data, response } = await api.GET('/v1/auth/me', {
    headers: { cookie: `${SESSION_COOKIE}=${session.value}` },
    signal: AbortSignal.timeout(ME_TIMEOUT_MS),
  });
  if (response.status === 401) {
    return null;
  }
  if (!data) {
    throw new Error(`GET /v1/auth/me failed with ${response.status}`);
  }
  return data;
});
