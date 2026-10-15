import { backendUrl } from '@/api/backend-url';
import { proxyToBackend } from '@/api/proxy';

function handler(request: Request): Promise<Response> {
  return proxyToBackend(request, backendUrl());
}

export {
  handler as DELETE,
  handler as GET,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
