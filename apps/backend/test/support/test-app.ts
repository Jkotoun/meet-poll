import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types.js';
import { AppModule } from '../../src/app.module.js';
import { validateEnvironment } from '../../src/config/environment.js';
import { createTestDatabase, TestDatabase } from './test-database.js';

export interface TestApp {
  app: INestApplication<App>;
  database: TestDatabase;
  close(): Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  const database = await createTestDatabase();
  const config = validateEnvironment({
    ...process.env,
    DATABASE_URL: database.url,
  });

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ConfigService)
    .useValue(new ConfigService(config))
    .compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  await app.init();

  return {
    app,
    database,
    close: async () => {
      await app.close();
      await database.drop();
    },
  };
}
