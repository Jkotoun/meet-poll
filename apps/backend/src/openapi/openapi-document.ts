import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  getSchemaPath,
  OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import {
  PROBLEM_JSON,
  ProblemDetailsDto,
} from '../http-errors/problem-details.dto.js';

export const API_VERSION = '1';

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch'] as const;

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Meet Poll API')
    .setVersion(API_VERSION)
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ProblemDetailsDto],
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey.replace(/Controller$/, '')}_${methodKey}`,
  });
  addProblemResponses(document);
  return document;
}

function addProblemResponses(document: OpenAPIObject): void {
  const problemResponse = {
    description: 'Error (RFC 9457 problem details)',
    content: {
      [PROBLEM_JSON]: { schema: { $ref: getSchemaPath(ProblemDetailsDto) } },
    },
  };
  for (const pathItem of Object.values(document.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (operation) {
        operation.responses.default ??= problemResponse;
      }
    }
  }
}
