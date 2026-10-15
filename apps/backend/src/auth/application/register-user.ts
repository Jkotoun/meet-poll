import { Injectable } from '@nestjs/common';
import { UsersService, type UserDto } from '../../users/users.api.js';
import { PasswordHasher } from './password-hasher.js';

export interface Registration {
  email: string;
  name: string;
  password: string;
}

@Injectable()
export class RegisterUser {
  constructor(
    private readonly users: UsersService,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute({ email, name, password }: Registration): Promise<UserDto> {
    const passwordHash = await this.passwordHasher.hash(password);
    return this.users.registerWithPassword({ email, name, passwordHash });
  }
}
