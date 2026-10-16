import { HttpException, HttpStatus } from '@nestjs/common';

export interface ProblemType {
  status: HttpStatus;
  code: string;
  title: string;
}

// An error with its own problem `type` (`/problems/<code>`) that clients can branch on.
export class ProblemException extends HttpException {
  constructor(
    readonly problemType: ProblemType,
    detail: string,
  ) {
    super(detail, problemType.status);
  }
}

export function problemTypeUri({ code }: ProblemType): string {
  return `/problems/${code}`;
}
