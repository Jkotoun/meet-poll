'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { FormField } from './form-field';
import { FormFooter } from './form-footer';
import { nextPath, serverValidated } from './server-validated';
import { useLogIn } from './session';
import { required } from './validators';

export function LogInForm() {
  const router = useRouter();
  const logIn = useLogIn();
  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmitAsync: serverValidated(logIn.mutateAsync) },
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
      <form.Subscribe
        selector={(state) => ({
          formError: state.errorMap.onSubmit,
          busy: state.isSubmitting || state.isSubmitSuccessful,
        })}
      >
        {({ formError, busy }) => (
          <FormFooter submitLabel="Log in" formError={formError} busy={busy} />
        )}
      </form.Subscribe>
    </form>
  );
}
