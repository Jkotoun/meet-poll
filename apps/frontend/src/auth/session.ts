'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { browserApi, unwrap } from '@/api/browser-client';
import type { components } from '@/api/schema';

export type User = components['schemas']['UserResponseDto'];
export type LogInRequest = components['schemas']['LogInRequestDto'];
export type RegisterRequest = components['schemas']['RegisterRequestDto'];

export const CURRENT_USER_KEY = ['auth', 'me'] as const;

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
    // Nothing cached under the old session may outlive it.
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(CURRENT_USER_KEY, null);
    },
  });
}
