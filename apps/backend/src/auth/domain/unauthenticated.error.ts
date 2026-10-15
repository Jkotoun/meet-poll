import {
  DomainError,
  DomainErrorKind,
  DomainErrorType,
} from '../../shared/domain/domain-error.js';

export const UNAUTHENTICATED: DomainErrorType = {
  kind: DomainErrorKind.Unauthenticated,
  code: 'unauthenticated',
  title: 'Authentication required',
};

export class UnauthenticatedError extends DomainError {
  constructor() {
    super(UNAUTHENTICATED, 'Sign in to continue');
  }
}
