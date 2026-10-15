'use client';

import TextField, { type TextFieldProps } from '@mui/material/TextField';
import type { AnyFieldApi } from '@tanstack/react-form';
import { useId } from 'react';

interface FormFieldProps extends Omit<
  TextFieldProps,
  'id' | 'name' | 'value' | 'onChange' | 'onBlur' | 'error' | 'helperText'
> {
  field: AnyFieldApi;
}

export function FormField({ field, ...props }: FormFieldProps) {
  const id = useId();
  const error = field.state.meta.errors.find(Boolean);
  return (
    <TextField
      {...props}
      id={id}
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
