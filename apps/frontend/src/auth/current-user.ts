import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { serverApi } from '@/api/server-client';
import type { User } from './session';

const SESSION_COOKIE = 'session';

export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (!(await cookies()).has(SESSION_COOKIE)) {
    return null;
  }
  const api = await serverApi();
  const { data, response } = await api.GET('/v1/auth/me');
  if (response.status === 401) {
    return null;
  }
  if (!data) {
    throw new Error(`GET /v1/auth/me failed with ${response.status}`);
  }
  return data;
});

export async function requireUser(path: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${path}`);
  }
  return user;
}
