'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { FormField, AuthForm, required, submitToServer } from './form';
import { nextPath } from './safe-next';
import { useLogin } from './session';

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmitAsync: submitToServer(login.mutateAsync) },
    onSubmit: () => router.replace(nextPath()),
  });

  return (
    <AuthForm form={form} submitLabel="Log in">
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
        validators={{ onSubmit: required('Password') }}
      >
        {(field) => (
          <FormField
            field={field}
            label="Password"
            type="password"
            autoComplete="current-password"
          />
        )}
      </form.Field>
    </AuthForm>
  );
}
