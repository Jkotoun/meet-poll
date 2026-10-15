import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { HttpErrorsModule } from './http-errors/http-errors.module.js';

@Module({
  imports: [ConfigModule, DatabaseModule, HealthModule, HttpErrorsModule],
})
export class AppModule {}
