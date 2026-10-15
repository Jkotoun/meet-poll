export enum DomainErrorKind {
  Unauthenticated = 'unauthenticated',
  Conflict = 'conflict',
  NotFound = 'not-found',
  Forbidden = 'forbidden',
  Unprocessable = 'unprocessable',
}

export interface DomainErrorType {
  readonly kind: DomainErrorKind;
  readonly code: string;
  readonly title: string;
}

export abstract class DomainError extends Error {
  protected constructor(
    readonly type: DomainErrorType,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
