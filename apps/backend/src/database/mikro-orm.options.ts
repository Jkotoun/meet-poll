import { join } from 'node:path';
import { defineConfig } from '@mikro-orm/postgresql';
import { IdentitySchema } from '../users/infrastructure/persistence/identity.schema.js';
import { UserSchema } from '../users/infrastructure/persistence/user.schema.js';

export function createMikroOrmOptions(databaseUrl: string) {
  return defineConfig({
    clientUrl: databaseUrl,
    entities: [UserSchema, IdentitySchema],
    migrations: {
      path: join(import.meta.dirname, 'migrations'),
      snapshotName: '.snapshot',
    },
  });
}
