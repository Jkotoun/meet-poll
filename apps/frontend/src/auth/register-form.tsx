'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { FormField } from './form-field';
import { FormFooter } from './form-footer';
import { nextPath, serverValidated } from './server-validated';
import { useRegister } from './session';
import { minLength, required } from './validators';

export function RegisterForm() {
  const router = useRouter();
  const register = useRegister();
  const form = useForm({
    defaultValues: { name: '', email: '', password: '' },
    validators: { onSubmitAsync: serverValidated(register.mutateAsync) },
    onSubmit: () => router.replace(nextPath()),
  });

  return (
    <form
      method="post"
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
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
      <form.Subscribe
        selector={(state) => ({
          formError: state.errorMap.onSubmit,
          busy: state.isSubmitting || state.isSubmitSuccessful,
        })}
      >
        {({ formError, busy }) => (
          <FormFooter
            submitLabel="Create account"
            formError={formError}
            busy={busy}
          />
        )}
      </form.Subscribe>
    </form>
  );
}
