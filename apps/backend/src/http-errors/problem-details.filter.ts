import { STATUS_CODES } from 'node:http';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ABOUT_BLANK,
  PROBLEM_JSON,
  ProblemDetailsDto,
} from './problem-details.dto.js';
import { RequestValidationException } from './request-validation.exception.js';

interface ClientError {
  status: number;
  message: string;
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const problem = toProblem(exception, request.path);
    if (problem.status >= 500) {
      this.logger.error(`${request.method} ${request.path}`, exception);
    }

    if (response.headersSent) {
      response.end();
      return;
    }
    response.status(problem.status).type(PROBLEM_JSON).json(problem);
  }
}

function toProblem(exception: unknown, instance: string): ProblemDetailsDto {
  const { status, detail } = classify(exception);
  const title = STATUS_CODES[status] ?? 'Error';
  const problem: ProblemDetailsDto = {
    type: ABOUT_BLANK,
    title,
    status,
    instance,
  };

  // Exceptions created without a message carry the status phrase as their message.
  if (detail && detail !== title) {
    problem.detail = detail;
  }
  if (exception instanceof RequestValidationException) {
    problem.errors = exception.errors;
  }
  return problem;
}

function classify(exception: unknown): { status: number; detail?: string } {
  if (exception instanceof HttpException) {
    return {
      status: exception.getStatus(),
      detail: httpExceptionMessage(exception),
    };
  }
  if (isClientError(exception)) {
    return { status: exception.status, detail: exception.message };
  }
  // Messages of unexpected errors may leak internals, so their bodies stay generic.
  return { status: HttpStatus.INTERNAL_SERVER_ERROR };
}

function httpExceptionMessage(exception: HttpException): string | undefined {
  const body = exception.getResponse();
  if (typeof body === 'string') {
    return body;
  }
  const { message } = body as { message?: unknown };
  if (Array.isArray(message)) {
    return message.join('; ');
  }
  return typeof message === 'string' ? message : undefined;
}

// Express body parsing fails with http-errors (413, 415, ...), not HttpExceptions.
function isClientError(exception: unknown): exception is ClientError {
  if (typeof exception !== 'object' || exception === null) {
    return false;
  }
  const { status, expose, message } = exception as Record<string, unknown>;
  return (
    typeof status === 'number' &&
    status >= 400 &&
    status < 500 &&
    expose === true &&
    typeof message === 'string'
  );
}
