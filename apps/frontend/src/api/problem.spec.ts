import { describe, expect, it } from 'bun:test';
import { toFormErrors, type Problem } from './problem';

const base = {
  title: 'Bad Request',
  status: 400,
  instance: '/v1/auth/register',
};

describe('toFormErrors', () => {
  it('maps body pointers to fields', () => {
    const problem: Problem = {
      ...base,
      type: 'about:blank',
      errors: [
        { pointer: '#/email', detail: 'email must be an email' },
        { pointer: '#/password', detail: 'password is too short' },
      ],
    };

    expect(toFormErrors(problem, ['email', 'password'])).toEqual({
      form: undefined,
      fields: {
        email: 'email must be an email',
        password: 'password is too short',
      },
    });
  });

  it('keeps the first error per field', () => {
    const problem: Problem = {
      ...base,
      type: 'about:blank',
      errors: [
        { pointer: '#/email', detail: 'email must be an email' },
        { pointer: '#/email', detail: 'email must not be empty' },
      ],
    };

    expect(toFormErrors(problem, ['email']).fields).toEqual({
      email: 'email must be an email',
    });
  });

  it('shows the detail at form level when no field matches', () => {
    const problem: Problem = {
      ...base,
      type: '/problems/email-already-registered',
      title: 'Email already registered',
      status: 409,
      detail: 'An account with this email already exists',
    };

    expect(toFormErrors(problem, ['email'])).toEqual({
      form: 'An account with this email already exists',
      fields: {},
    });
  });

  it('ignores pointers to fields the form does not have', () => {
    const problem: Problem = {
      ...base,
      type: 'about:blank',
      errors: [
        { pointer: '#/isAdmin', detail: 'property isAdmin should not exist' },
      ],
    };

    expect(toFormErrors(problem, ['email'])).toEqual({
      form: 'property isAdmin should not exist',
      fields: {},
    });
  });
});
