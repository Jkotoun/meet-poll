import { Injectable } from '@nestjs/common';
import { NewPasswordUser, User } from '../domain/user.js';
import { UserRepository } from '../domain/user.repository.js';

export interface UserDto {
  id: string;
  email: string;
  name: string;
}

export interface PasswordCredentials {
  user: UserDto;
  passwordHash: string | null;
}

@Injectable()
export class UsersService {
  constructor(private readonly users: UserRepository) {}

  async registerWithPassword(newUser: NewPasswordUser): Promise<UserDto> {
    const user = User.registerWithPassword(newUser);
    await this.users.save(user);
    return toDto(user);
  }

  async findById(id: string): Promise<UserDto | null> {
    const user = await this.users.findById(id);
    return user && toDto(user);
  }

  async findPasswordCredentials(
    email: string,
  ): Promise<PasswordCredentials | null> {
    const user = await this.users.findByEmail(email);
    return user && { user: toDto(user), passwordHash: user.passwordHash() };
  }
}

function toDto({ id, email, name }: User): UserDto {
  return { id, email, name };
}
