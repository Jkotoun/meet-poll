import { backendConfig } from './api/backend-config';

// Fail at startup rather than on the first /api request.
export function register(): void {
  backendConfig();
}
