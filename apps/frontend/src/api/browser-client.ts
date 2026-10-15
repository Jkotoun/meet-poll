import 'client-only';
import { createApiClient } from './client';
import { ProblemError, type Problem } from './problem';

// Same-origin proxy; only valid in the browser.
export const browserApi = createApiClient('/api');

interface ApiResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

// Judge by status: error bodies may be empty or not problem+json (e.g. an HTML 502).
export function unwrap<T>({ data, error, response }: ApiResult<T>): T {
  if (!response.ok) {
    throw new ProblemError(isProblem(error) ? error : genericProblem(response));
  }
  return data as T;
}

function isProblem(body: unknown): body is Problem {
  return typeof body === 'object' && body !== null && 'title' in body;
}

function genericProblem(response: Response): Problem {
  return {
    type: 'about:blank',
    title: response.statusText || 'Request failed',
    status: response.status,
    instance: new URL(response.url).pathname,
  };
}
