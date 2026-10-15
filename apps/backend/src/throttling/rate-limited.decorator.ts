import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiTooManyRequestsResponse, getSchemaPath } from '@nestjs/swagger';
import {
  PROBLEM_JSON,
  ProblemDetailsDto,
} from '../http-errors/problem-details.dto.js';
import { RateLimitGuard } from './rate-limit.guard.js';

export function RateLimited(): MethodDecorator {
  return applyDecorators(
    UseGuards(RateLimitGuard),
    ApiTooManyRequestsResponse({
      description: 'Too Many Requests',
      content: {
        [PROBLEM_JSON]: { schema: { $ref: getSchemaPath(ProblemDetailsDto) } },
      },
    }),
  );
}
