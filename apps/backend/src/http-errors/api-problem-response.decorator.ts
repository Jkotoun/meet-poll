import { STATUS_CODES } from 'node:http';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { DomainErrorType } from '../shared/domain/domain-error.js';
import { PROBLEM_JSON, ProblemBaseDto } from './problem-details.dto.js';
import { problemStatus, problemTypeUri } from './problem-types.js';

export function ApiProblemResponse(
  ...types: DomainErrorType[]
): MethodDecorator {
  const statuses = [...new Set(types.map(problemStatus))];
  return applyDecorators(
    ...statuses.map((status) =>
      problemResponse(
        status,
        types.filter((type) => problemStatus(type) === status),
      ),
    ),
  );
}

function problemResponse(
  status: HttpStatus,
  types: DomainErrorType[],
): MethodDecorator {
  return ApiResponse({
    status,
    description: STATUS_CODES[status],
    content: {
      [PROBLEM_JSON]: {
        schema: {
          allOf: [
            { $ref: getSchemaPath(ProblemBaseDto) },
            {
              type: 'object',
              required: ['type'],
              properties: {
                type: { type: 'string', enum: types.map(problemTypeUri) },
              },
            },
          ],
        },
      },
    },
  });
}
