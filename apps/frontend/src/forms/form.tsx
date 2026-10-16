'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import {
  useStore,
  type AnyFieldApi,
  type AnyFormApi,
} from '@tanstack/react-form';
import type { ReactNode } from 'react';
import { ProblemError, toFormErrors, type FormErrors } from '@/api/problem';

const UNREACHABLE = 'Could not reach the server. Try again.';

// Runs the request as the submit validator, so `onSubmit` (the redirect) only
// runs on success and the server's problem becomes form/field errors.
export function submitToServer<T extends object>(
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

export function required(label: string) {
  return ({ value }: { value: string }) =>
    value.trim() ? undefined : `${label} is required`;
}

export function minLength(label: string, min: number) {
  return ({ value }: { value: string }) =>
    value.length >= min
      ? undefined
      : `${label} must be at least ${min} characters`;
}

interface FormFieldProps extends Omit<
  TextFieldProps,
  'name' | 'value' | 'onChange' | 'onBlur' | 'error' | 'helperText'
> {
  field: AnyFieldApi;
}

export function FormField({ field, ...props }: FormFieldProps) {
  const error = field.state.meta.errors.find(Boolean);
  return (
    <TextField
      {...props}
      name={field.name}
      value={field.state.value}
      onChange={(event) => field.handleChange(event.target.value)}
      onBlur={field.handleBlur}
      error={Boolean(error)}
      helperText={typeof error === 'string' ? error : undefined}
      fullWidth
    />
  );
}

interface SubmitFormProps {
  form: AnyFormApi;
  submitLabel: string;
  children: ReactNode;
}

export function SubmitForm({ form, submitLabel, children }: SubmitFormProps) {
  const formError = useStore(form.store, (state) => state.errorMap.onSubmit);
  // Stays disabled after success, while the redirect is in flight.
  const busy = useStore(
    form.store,
    (state) => state.isSubmitting || state.isSubmitSuccessful,
  );
  return (
    // POST, so a submit before hydration never puts the password in the URL.
    <form
      method="post"
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {children}
      {typeof formError === 'string' && (
        <Alert severity="error">{formError}</Alert>
      )}
      <Button type="submit" variant="contained" disabled={busy}>
        {submitLabel}
      </Button>
    </form>
  );
}
