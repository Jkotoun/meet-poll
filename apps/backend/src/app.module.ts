import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { EventsModule } from './events/events.module.js';
import { HealthModule } from './health/health.module.js';
import { HttpErrorsModule } from './http-errors/http-errors.module.js';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    DatabaseModule,
    EventsModule,
    HealthModule,
    HttpErrorsModule,
  ],
})
export class AppModule {}
