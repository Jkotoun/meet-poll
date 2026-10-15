import { BadRequestException, ValidationError } from '@nestjs/common';
import { InvalidFieldDto } from './problem-details.dto.js';

export class RequestValidationException extends BadRequestException {
  readonly errors: InvalidFieldDto[];

  constructor(validationErrors: ValidationError[]) {
    super('Request validation failed');
    this.errors = toInvalidFields(validationErrors, '#');
  }
}

function toInvalidFields(
  validationErrors: ValidationError[],
  parentPointer: string,
): InvalidFieldDto[] {
  return validationErrors.flatMap((error) => {
    const pointer = `${parentPointer}/${escapePointerToken(error.property)}`;
    const own = Object.values(error.constraints ?? {}).map((detail) => ({
      pointer,
      detail,
    }));
    return [...own, ...toInvalidFields(error.children ?? [], pointer)];
  });
}

// RFC 6901: escape "~" and "/", then percent-encode for the "#" fragment form.
function escapePointerToken(token: string): string {
  return encodeURIComponent(token.replaceAll('~', '~0').replaceAll('/', '~1'));
}
