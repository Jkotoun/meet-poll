import { join } from 'node:path';
import { defineConfig } from '@mikro-orm/postgresql';

export function createMikroOrmOptions(databaseUrl: string) {
  return defineConfig({
    clientUrl: databaseUrl,
    entities: [],
    discovery: { warnWhenNoEntities: false },
    migrations: {
      path: join(import.meta.dirname, 'migrations'),
      snapshotName: '.snapshot',
    },
  });
}
