import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { HttpErrorsModule } from './http-errors/http-errors.module.js';
import { ThrottlingModule } from './throttling/throttling.module.js';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    DatabaseModule,
    HealthModule,
    HttpErrorsModule,
    ThrottlingModule,
  ],
})
export class AppModule {}
