import type { components } from './schema';

export type Problem = components['schemas']['ProblemBaseDto'] & {
  type: string;
};

export class ProblemError extends Error {
  constructor(readonly problem: Problem) {
    super(problem.detail ?? problem.title);
  }
}

interface ApiResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

// Judge by status: error bodies may be empty or not problem+json (e.g. an HTML 502).
export function unwrap<T>({ data, error, response }: ApiResult<T>): T {
  if (!response.ok) {
    throw new ProblemError(
      isProblem(error)
        ? error
        : {
            type: 'about:blank',
            title: response.statusText || 'Request failed',
            status: response.status,
            instance: new URL(response.url).pathname,
          },
    );
  }
  return data as T;
}

function isProblem(body: unknown): body is Problem {
  return typeof body === 'object' && body !== null && 'title' in body;
}

export interface FormErrors {
  form?: string;
  fields: Record<string, string>;
}

// Problem `errors[]` point at body fields (`#/email`); anything else is form-level.
export function toFormErrors(
  problem: Problem,
  fieldNames: string[],
): FormErrors {
  const fields: Record<string, string> = {};
  for (const { pointer, detail } of problem.errors ?? []) {
    const field = pointer.replace(/^#\//, '');
    if (fieldNames.includes(field)) {
      fields[field] ??= detail;
    }
  }
  const hasFieldErrors = Object.keys(fields).length > 0;
  return {
    // An error for a field the form doesn't show still beats a generic detail.
    form: hasFieldErrors
      ? undefined
      : (problem.errors?.[0]?.detail ?? problem.detail ?? problem.title),
    fields,
  };
}
