import { Injectable } from '@nestjs/common';
import { NewPasswordUser, User } from '../domain/user.js';
import { UserRepository } from '../domain/user.repository.js';

export interface UserDto {
  id: string;
  email: string;
  name: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly users: UserRepository) {}

  async registerWithPassword(newUser: NewPasswordUser): Promise<UserDto> {
    const user = User.registerWithPassword(newUser);
    await this.users.save(user);
    return toDto(user);
  }
}

function toDto({ id, email, name }: User): UserDto {
  return { id, email, name };
}
