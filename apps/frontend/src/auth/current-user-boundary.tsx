import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import { getCurrentUser } from './current-user';
import { CURRENT_USER_KEY } from './query-keys';

interface CurrentUserBoundaryProps {
  children: ReactNode;
}

// Seeds the session user so the nav is right in the server HTML. If the backend
// is unreachable, nothing is seeded and the browser fetches it instead, so
// public pages still render.
export async function CurrentUserBoundary({
  children,
}: CurrentUserBoundaryProps) {
  await connection();
  const queryClient = new QueryClient();
  try {
    queryClient.setQueryData(CURRENT_USER_KEY, await getCurrentUser());
  } catch (error) {
    console.error('Could not load the session user', error);
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
