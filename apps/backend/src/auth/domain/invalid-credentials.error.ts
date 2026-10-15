import {
  DomainError,
  DomainErrorKind,
  DomainErrorType,
} from '../../shared/domain/domain-error.js';

export const INVALID_CREDENTIALS: DomainErrorType = {
  kind: DomainErrorKind.Unauthenticated,
  code: 'invalid-credentials',
  title: 'Invalid credentials',
};

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super(INVALID_CREDENTIALS, 'The email or password is incorrect');
  }
}
