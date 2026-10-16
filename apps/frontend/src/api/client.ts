import createClient, { type ClientOptions } from 'openapi-fetch';
import type { paths } from './schema';

// Browser code passes '/api' (the same-origin proxy); server code passes backendUrl().
export function createApiClient(
  baseUrl: string,
  options: Omit<ClientOptions, 'baseUrl'> = {},
) {
  return createClient<paths>({ baseUrl, ...options });
}
