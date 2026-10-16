import { STATUS_CODES } from 'node:http';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { PROBLEM_JSON, ProblemBaseDto } from './problem-details.dto.js';
import { ProblemType, problemTypeUri } from './problem.exception.js';

export function ApiProblemResponse(...types: ProblemType[]): MethodDecorator {
  const statuses = [...new Set(types.map((type) => type.status))];
  return applyDecorators(
    ...statuses.map((status) =>
      problemResponse(
        status,
        types.filter((type) => type.status === status),
      ),
    ),
  );
}

function problemResponse(
  status: HttpStatus,
  types: ProblemType[],
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
