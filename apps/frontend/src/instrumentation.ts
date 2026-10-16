import { backendUrl } from './api/backend-url';

// Fail at startup rather than on the first /api request.
export function register(): void {
  backendUrl();
}
