import { randomUUID } from 'node:crypto';
import { SQL } from 'bun';
import { validateEnvironment } from '../../src/config/environment.js';

export interface TestDatabase {
  name: string;
  url: string;
  drop(): Promise<void>;
}

async function runOnServer(serverUrl: string, statement: string) {
  const sql = new SQL(serverUrl);
  try {
    await sql.unsafe(statement);
  } finally {
    await sql.close();
  }
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const serverUrl = validateEnvironment(process.env).DATABASE_URL;
  const name = `meetpoll_test_${randomUUID().replaceAll('-', '')}`;
  await runOnServer(serverUrl, `CREATE DATABASE "${name}"`);

  const url = new URL(serverUrl);
  url.pathname = `/${name}`;

  return {
    name,
    url: url.toString(),
    drop: () => runOnServer(serverUrl, `DROP DATABASE "${name}" WITH (FORCE)`),
  };
}
