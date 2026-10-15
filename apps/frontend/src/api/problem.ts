import type { components } from './schema';

export type Problem = components['schemas']['ProblemBaseDto'] & {
  type: string;
};

export class ProblemError extends Error {
  constructor(readonly problem: Problem) {
    super(problem.detail ?? problem.title);
  }
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
    form: hasFieldErrors ? undefined : (problem.detail ?? problem.title),
    fields,
  };
}
