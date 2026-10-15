import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  INestApplication,
  NotFoundException,
  Post,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import type { Response } from 'express';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DomainError, DomainErrorKind } from '../shared/domain/domain-error.js';
import { HttpErrorsModule } from './http-errors.module.js';

class ThingTakenError extends DomainError {
  constructor() {
    super(
      {
        kind: DomainErrorKind.Conflict,
        code: 'thing-taken',
        title: 'Thing taken',
      },
      'Thing "a" is taken',
    );
  }
}

class SlotDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  minutes: number;
}

class CreateThingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ type: [SlotDto] })
  @ValidateNested({ each: true })
  @Type(() => SlotDto)
  slots: SlotDto[];
}

@Controller('things')
class ThingsController {
  @Post()
  create(@Body() body: CreateThingDto): { transformed: boolean } {
    return {
      transformed:
        body instanceof CreateThingDto && body.slots[0] instanceof SlotDto,
    };
  }

  @Get('missing')
  missing(): never {
    throw new NotFoundException('Thing not found');
  }

  @Get('taken')
  taken(): never {
    throw new ThingTakenError();
  }

  @Get('ambiguous')
  ambiguous(): never {
    throw new BadRequestException(['first problem', 'second problem']);
  }

  @Get('maintenance')
  maintenance(): never {
    throw new ServiceUnavailableException('Down for maintenance');
  }

  @Get('broken')
  broken(): never {
    throw new Error('connection string postgres://secret');
  }

  @Get('half-sent')
  halfSent(@Res() response: Response): never {
    response.status(200).write('partial');
    throw new Error('failed mid-response');
  }
}

const validThing = { title: 'a', slots: [{ minutes: 1 }] };

describe('HTTP errors (RFC 9457 problem details)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HttpErrorsModule],
      controllers: [ThingsController],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('maps HTTP exceptions to problem+json', async () => {
    const response = await request(app.getHttpServer())
      .get('/things/missing')
      .expect(404)
      .expect('Content-Type', /application\/problem\+json/);
    expect(response.body).toEqual({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Thing not found',
      instance: '/things/missing',
    });
  });

  it('maps domain errors to their status and problem type', async () => {
    const response = await request(app.getHttpServer())
      .get('/things/taken')
      .expect(409)
      .expect('Content-Type', /application\/problem\+json/);
    expect(response.body).toEqual({
      type: '/problems/thing-taken',
      title: 'Thing taken',
      status: 409,
      detail: 'Thing "a" is taken',
      instance: '/things/taken',
    });
  });

  it('maps unknown routes to problem+json', async () => {
    const response = await request(app.getHttpServer())
      .get('/nope')
      .expect(404)
      .expect('Content-Type', /application\/problem\+json/);
    expect(response.body).toMatchObject({ title: 'Not Found', status: 404 });
  });

  it('joins array messages into the detail', async () => {
    const response = await request(app.getHttpServer())
      .get('/things/ambiguous')
      .expect(400);
    expect(response.body.detail).toBe('first problem; second problem');
  });

  it('keeps the detail of deliberate 5xx HTTP exceptions', async () => {
    const response = await request(app.getHttpServer())
      .get('/things/maintenance')
      .expect(503);
    expect(response.body.detail).toBe('Down for maintenance');
  });

  it('hides details of unexpected errors', async () => {
    const response = await request(app.getHttpServer())
      .get('/things/broken')
      .expect(500);
    expect(response.body).toEqual({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      instance: '/things/broken',
    });
  });

  it('ends a response whose headers were already sent', async () => {
    const response = await request(app.getHttpServer())
      .get('/things/half-sent')
      .expect(200);
    expect(response.text).toBe('partial');
  });

  it('lists invalid fields as JSON pointers, including array items', async () => {
    const response = await request(app.getHttpServer())
      .post('/things')
      .send({ title: '', slots: [{ minutes: -1 }] })
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
    expect(response.body).toMatchObject({
      title: 'Bad Request',
      detail: 'Request validation failed',
      errors: [
        { pointer: '#/title', detail: 'title should not be empty' },
        {
          pointer: '#/slots/0/minutes',
          detail: 'minutes must not be less than 0',
        },
      ],
    });
  });

  it('escapes pointer tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/things')
      .send({ ...validThing, 'a/b~c d': true })
      .expect(400);
    expect(response.body.errors).toEqual([
      { pointer: '#/a~1b~0c%20d', detail: 'property a/b~c d should not exist' },
    ]);
  });

  it('transforms valid bodies into DTO instances', async () => {
    const response = await request(app.getHttpServer())
      .post('/things')
      .send(validThing)
      .expect(201);
    expect(response.body).toEqual({ transformed: true });
  });

  it('maps malformed JSON to 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/things')
      .set('Content-Type', 'application/json')
      .send('{bad')
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
    expect(response.body).toMatchObject({ title: 'Bad Request', status: 400 });
  });

  it('maps body parser errors to their 4xx status', async () => {
    const response = await request(app.getHttpServer())
      .post('/things')
      .send({ ...validThing, title: 'x'.repeat(200_000) })
      .expect(413)
      .expect('Content-Type', /application\/problem\+json/);
    expect(response.body).toMatchObject({
      title: 'Payload Too Large',
      status: 413,
    });
  });
});
