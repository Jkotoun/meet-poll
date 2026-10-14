import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { bootApp } from './support/test-app.js';
import { createTestDatabase, TestDatabase } from './support/test-database.js';

async function executedMigrations(em: EntityManager): Promise<string[]> {
  const rows = await em
    .getConnection()
    .execute<{ name: string }[]>('select name from mikro_orm_migrations');
  return rows.map((row) => row.name);
}

describe('Migrations on startup (e2e)', () => {
  let database: TestDatabase;

  beforeAll(async () => {
    database = await createTestDatabase();
  });

  afterAll(async () => {
    await database.drop();
  });

  it('applies every migration once when instances start concurrently', async () => {
    const apps = await Promise.all([
      bootApp(database.url),
      bootApp(database.url),
      bootApp(database.url),
    ]);
    try {
      const orm = apps[0].get(MikroORM);
      const pending = await orm.migrator.getPending();
      const executed = await executedMigrations(orm.em);

      expect(pending).toEqual([]);
      expect(executed.length).toBeGreaterThan(0);
      expect(new Set(executed).size).toBe(executed.length);
    } finally {
      await Promise.all(apps.map((app) => app.close()));
    }
  });
});
