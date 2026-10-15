import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { PasswordHasher } from './application/password-hasher.js';
import { RegisterUser } from './application/register-user.js';
import { Argon2PasswordHasher } from './infrastructure/hashing/argon2-password-hasher.js';
import { AuthController } from './infrastructure/http/auth.controller.js';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    RegisterUser,
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
  ],
})
export class AuthModule {}
