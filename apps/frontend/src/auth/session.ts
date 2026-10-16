import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { browserApi } from '@/api/browser-client';
import { unwrap } from '@/api/problem';
import type { components } from '@/api/schema';
import { CURRENT_USER_KEY } from './query-keys';

export type User = components['schemas']['UserDto'];
type LoginRequest = components['schemas']['LoginDto'];
type RegisterRequest = components['schemas']['RegisterDto'];

async function fetchCurrentUser(): Promise<User | null> {
  const result = await browserApi.GET('/v1/auth/me');
  return result.response.status === 401 ? null : unwrap(result);
}

export function useCurrentUser() {
  return useQuery({ queryKey: CURRENT_USER_KEY, queryFn: fetchCurrentUser });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: LoginRequest) =>
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

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      unwrap(await browserApi.POST('/v1/auth/logout'));
    },
    onSuccess: () => queryClient.setQueryData(CURRENT_USER_KEY, null),
  });
}
