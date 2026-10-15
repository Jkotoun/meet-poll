import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../config/environment.js';
import { MigrationRunner } from './migration-runner.js';
import { createMikroOrmOptions } from './mikro-orm.options.js';

@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) =>
        createMikroOrmOptions(config.get('DATABASE_URL', { infer: true })),
    }),
  ],
  providers: [MigrationRunner],
})
export class DatabaseModule {}
