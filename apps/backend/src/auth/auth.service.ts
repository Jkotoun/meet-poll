import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ProblemException,
  ProblemType,
} from '../http-errors/problem.exception.js';
import { IdentityProvider } from '../users/entities/identity.entity.js';
import type { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import { hashPassword, verifyPassword } from './password.js';

export const INVALID_CREDENTIALS: ProblemType = {
  status: HttpStatus.UNAUTHORIZED,
  code: 'invalid-credentials',
  title: 'Invalid credentials',
};

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService) {}

  async register({ email, name, password }: RegisterDto): Promise<User> {
    const passwordHash = await hashPassword(password);
    return this.users.createWithPassword({ email, name, passwordHash });
  }

  async login({ email, password }: LoginDto): Promise<User> {
    const user = await this.users.findByEmail(email);
    const passwordHash = user?.identities.find(
      (identity) => identity.provider === IdentityProvider.Password,
    )?.passwordHash;
    const valid = await verifyPassword(password, passwordHash ?? null);
    if (!user || !valid) {
      throw new ProblemException(
        INVALID_CREDENTIALS,
        'The email or password is incorrect',
      );
    }
    return user;
  }
}
