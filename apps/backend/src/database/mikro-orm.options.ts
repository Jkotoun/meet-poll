import { join } from 'node:path';
import { defineConfig } from '@mikro-orm/postgresql';
import { Event } from '../events/entities/event.entity.js';
import { TimeSlot } from '../events/entities/time-slot.entity.js';
import { Identity } from '../users/entities/identity.entity.js';
import { User } from '../users/entities/user.entity.js';

export function createMikroOrmOptions(databaseUrl: string) {
  return defineConfig({
    clientUrl: databaseUrl,
    entities: [User, Identity, Event, TimeSlot],
    migrations: {
      path: join(import.meta.dirname, 'migrations'),
      snapshotName: '.snapshot',
    },
  });
}
