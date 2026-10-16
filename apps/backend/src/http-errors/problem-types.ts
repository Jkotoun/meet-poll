import { HttpStatus } from '@nestjs/common';
import {
  DomainErrorKind,
  DomainErrorType,
} from '../shared/domain/domain-error.js';

const STATUS_BY_KIND: Record<DomainErrorKind, HttpStatus> = {
  [DomainErrorKind.Conflict]: HttpStatus.CONFLICT,
  [DomainErrorKind.NotFound]: HttpStatus.NOT_FOUND,
  [DomainErrorKind.Forbidden]: HttpStatus.FORBIDDEN,
  [DomainErrorKind.Unprocessable]: HttpStatus.UNPROCESSABLE_ENTITY,
};

export function problemStatus(type: DomainErrorType): HttpStatus {
  return STATUS_BY_KIND[type.kind];
}

export function problemTypeUri(type: DomainErrorType): string {
  return `/problems/${type.code}`;
}
