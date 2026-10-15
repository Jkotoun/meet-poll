import { backendUrl } from './api/backend-url';

// Fail at startup rather than on the first proxied request.
export function register(): void {
  backendUrl();
}
