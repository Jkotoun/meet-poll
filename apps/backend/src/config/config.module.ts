import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnvironment } from './environment.js';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      // Bun already loads .env files into process.env.
      ignoreEnvFile: true,
      validate: validateEnvironment,
    }),
  ],
})
export class ConfigModule {}
