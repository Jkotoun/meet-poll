import { ProblemError, toFormErrors, type FormErrors } from '@/api/problem';
import { safeNext } from './safe-next';

const UNREACHABLE = 'Could not reach the server. Try again.';

// Submitting is validated by the server: its problem becomes form/field errors.
export function serverValidated<T extends object>(
  submit: (value: T) => Promise<unknown>,
) {
  return async ({ value }: { value: T }): Promise<FormErrors | undefined> => {
    try {
      await submit(value);
      return undefined;
    } catch (error) {
      return error instanceof ProblemError
        ? toFormErrors(error.problem, Object.keys(value))
        : { form: UNREACHABLE, fields: {} };
    }
  };
}

// Read at submit time so the form itself needs no dynamic rendering.
export function nextPath(): string {
  return safeNext(new URLSearchParams(window.location.search).get('next'));
}
