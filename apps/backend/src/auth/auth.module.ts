import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Environment } from '../config/environment.js';
import { UsersModule } from '../users/users.module.js';
import { LogInUser } from './application/log-in-user.js';
import { PasswordHasher } from './application/password-hasher.js';
import { RegisterUser } from './application/register-user.js';
import { Argon2PasswordHasher } from './infrastructure/hashing/argon2-password-hasher.js';
import { AuthController } from './infrastructure/http/auth.controller.js';
import { SessionGuard } from './infrastructure/http/session.guard.js';
import {
  SESSION_AUDIENCE,
  SESSION_TTL_SECONDS,
  SessionCookie,
} from './infrastructure/session/session-cookie.js';

// Modules that protect routes with SessionGuard import AuthModule.
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: {
          algorithm: 'HS256',
          audience: SESSION_AUDIENCE,
          expiresIn: SESSION_TTL_SECONDS,
        },
        verifyOptions: { algorithms: ['HS256'], audience: SESSION_AUDIENCE },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUser,
    LogInUser,
    SessionCookie,
    SessionGuard,
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
  ],
  exports: [SessionCookie, SessionGuard, UsersModule],
})
export class AuthModule {}
