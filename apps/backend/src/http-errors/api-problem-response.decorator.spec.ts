import { describe, expect, it } from 'bun:test';
import { Controller, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createOpenApiDocument } from '../openapi/openapi-document.js';
import { DomainErrorKind } from '../shared/domain/domain-error.js';
import { ApiProblemResponse } from './api-problem-response.decorator.js';

@Controller('things')
class ThingsController {
  @Post()
  @ApiProblemResponse(
    {
      kind: DomainErrorKind.Conflict,
      code: 'thing-taken',
      title: 'Thing taken',
    },
    {
      kind: DomainErrorKind.Conflict,
      code: 'thing-locked',
      title: 'Thing locked',
    },
    {
      kind: DomainErrorKind.NotFound,
      code: 'owner-not-found',
      title: 'Owner not found',
    },
  )
  create(): void {}
}

async function responsesOf(path: string) {
  const moduleRef = await Test.createTestingModule({
    controllers: [ThingsController],
  }).compile();
  const app = moduleRef.createNestApplication();
  const document = createOpenApiDocument(app);
  await app.close();
  return document.paths[path].post?.responses ?? {};
}

function problemSchema(response: unknown) {
  return (response as any).content['application/problem+json'].schema;
}

describe('ApiProblemResponse', () => {
  it('documents each status with the problem types it can carry', async () => {
    const responses = await responsesOf('/things');

    expect(problemSchema(responses['409'])).toEqual({
      allOf: [
        { $ref: '#/components/schemas/ProblemBaseDto' },
        {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: ['/problems/thing-taken', '/problems/thing-locked'],
            },
          },
        },
      ],
    });
    expect(
      problemSchema(responses['404']).allOf[1].properties.type.enum,
    ).toEqual(['/problems/owner-not-found']);
  });

  it('keeps generic problems narrowed to about:blank', async () => {
    const responses = await responsesOf('/things');

    expect(problemSchema(responses.default)).toEqual({
      $ref: '#/components/schemas/ProblemDetailsDto',
    });
  });
});
