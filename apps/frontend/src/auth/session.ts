'use client';

import {
  hashKey,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { browserApi, unwrap } from '@/api/browser-client';
import type { components } from '@/api/schema';
import { CURRENT_USER_KEY } from './query-keys';

export type User = components['schemas']['UserResponseDto'];
export type LogInRequest = components['schemas']['LogInRequestDto'];
export type RegisterRequest = components['schemas']['RegisterRequestDto'];

async function fetchCurrentUser(): Promise<User | null> {
  const result = await browserApi.GET('/v1/auth/me');
  return result.response.status === 401 ? null : unwrap(result);
}

export function useCurrentUser() {
  return useQuery({ queryKey: CURRENT_USER_KEY, queryFn: fetchCurrentUser });
}

export function useLogIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: LogInRequest) =>
      unwrap(await browserApi.POST('/v1/auth/login', { body })),
    onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_KEY, user),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: RegisterRequest) =>
      unwrap(await browserApi.POST('/v1/auth/register', { body })),
    onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_KEY, user),
  });
}

export function useLogOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      unwrap(await browserApi.POST('/v1/auth/logout'));
    },
    // Data cached under the old session must not outlive it.
    onSuccess: () => {
      queryClient.removeQueries({
        predicate: (query) => query.queryHash !== hashKey(CURRENT_USER_KEY),
      });
      queryClient.setQueryData(CURRENT_USER_KEY, null);
    },
  });
}
