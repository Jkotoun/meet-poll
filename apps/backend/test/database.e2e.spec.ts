import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { MikroORM } from '@mikro-orm/postgresql';
import { createTestApp, TestApp } from './support/test-app.js';

describe('Database (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it("connects to the test file's own database", async () => {
    const orm = testApp.app.get(MikroORM);
    const [row] = await orm.em
      .getConnection()
      .execute<{ name: string }[]>('select current_database() as name');
    expect(row.name).toBe(testApp.database.name);
  });
});
