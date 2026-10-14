import { MikroORM } from '@mikro-orm/postgresql';
import { Injectable, OnModuleInit } from '@nestjs/common';

const MIGRATION_LOCK_KEY = 4_826_150_731;

@Injectable()
export class MigrationRunner implements OnModuleInit {
  constructor(private readonly orm: MikroORM) {}

  // Instances starting together queue on the lock; later ones find nothing pending.
  async onModuleInit(): Promise<void> {
    const connection = this.orm.em.getConnection();
    await connection.transactional(async (trx) => {
      await connection.execute(
        `select pg_advisory_xact_lock(${MIGRATION_LOCK_KEY})`,
        [],
        'all',
        trx,
      );
      await this.orm.migrator.up({ transaction: trx });
    });
  }
}
