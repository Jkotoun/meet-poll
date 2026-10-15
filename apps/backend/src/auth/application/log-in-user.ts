import { Injectable } from '@nestjs/common';
import { UsersService, type UserDto } from '../../users/users.api.js';
import { InvalidCredentialsError } from '../domain/invalid-credentials.error.js';
import { PasswordHasher } from './password-hasher.js';

export interface Credentials {
  email: string;
  password: string;
}

@Injectable()
export class LogInUser {
  constructor(
    private readonly users: UsersService,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute({ email, password }: Credentials): Promise<UserDto> {
    const credentials = await this.users.findPasswordCredentials(email);
    const valid = await this.passwordHasher.verify(
      password,
      credentials?.passwordHash ?? null,
    );
    if (!credentials || !valid) {
      throw new InvalidCredentialsError();
    }
    return credentials.user;
  }
}
