import createClient, { type ClientOptions } from 'openapi-fetch';
import type { paths } from './schema';

// Browser code passes '/api' (the same-origin proxy); server code passes backendUrl().
export function createApiClient(
  baseUrl: string,
  fetchImpl?: ClientOptions['fetch'],
) {
  return createClient<paths>({ baseUrl, fetch: fetchImpl });
}
