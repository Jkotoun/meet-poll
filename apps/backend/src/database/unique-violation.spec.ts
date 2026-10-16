import { describe, expect, it } from 'bun:test';
import { UniqueConstraintViolationException } from '@mikro-orm/postgresql';
import { isUniqueViolation } from './unique-violation.js';

function uniqueViolation(
  constraint: string,
): UniqueConstraintViolationException {
  return new UniqueConstraintViolationException(
    Object.assign(new Error('duplicate key'), { constraint }),
  );
}

describe('isUniqueViolation', () => {
  it('matches a unique violation of the given constraint', () => {
    expect(
      isUniqueViolation(
        uniqueViolation('users_email_unique'),
        'users_email_unique',
      ),
    ).toBe(true);
  });

  it('ignores other constraints and other errors', () => {
    expect(
      isUniqueViolation(uniqueViolation('other_unique'), 'users_email_unique'),
    ).toBe(false);
    expect(isUniqueViolation(new Error('boom'), 'users_email_unique')).toBe(
      false,
    );
  });
});
