'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import {
  FormField,
  AuthForm,
  minLength,
  required,
  submitToServer,
} from './form';
import { nextPath } from './safe-next';
import { useRegister } from './session';

export function RegisterForm() {
  const router = useRouter();
  const register = useRegister();
  const form = useForm({
    defaultValues: { name: '', email: '', password: '' },
    validators: { onSubmitAsync: submitToServer(register.mutateAsync) },
    onSubmit: () => router.replace(nextPath()),
  });

  return (
    <AuthForm form={form} submitLabel="Create account">
      <form.Field name="name" validators={{ onSubmit: required('Name') }}>
        {(field) => (
          <FormField field={field} label="Name" autoComplete="name" />
        )}
      </form.Field>
      <form.Field name="email" validators={{ onSubmit: required('Email') }}>
        {(field) => (
          <FormField
            field={field}
            label="Email"
            type="email"
            autoComplete="email"
          />
        )}
      </form.Field>
      <form.Field
        name="password"
        validators={{ onSubmit: minLength('Password', 8) }}
      >
        {(field) => (
          <FormField
            field={field}
            label="Password"
            type="password"
            autoComplete="new-password"
          />
        )}
      </form.Field>
    </AuthForm>
  );
}
