import {
  DomainError,
  DomainErrorKind,
  DomainErrorType,
} from '../../shared/domain/domain-error.js';

export const EMAIL_ALREADY_REGISTERED: DomainErrorType = {
  kind: DomainErrorKind.Conflict,
  code: 'email-already-registered',
  title: 'Email already registered',
};

export class EmailAlreadyRegisteredError extends DomainError {
  constructor() {
    super(
      EMAIL_ALREADY_REGISTERED,
      'An account with this email already exists',
    );
  }
}
