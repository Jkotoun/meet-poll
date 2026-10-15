import { Injectable } from '@nestjs/common';
import { NewPasswordUser, User } from '../domain/user.js';
import { UserRepository } from '../domain/user.repository.js';

export interface UserView {
  id: string;
  email: string;
  name: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly users: UserRepository) {}

  async registerWithPassword(newUser: NewPasswordUser): Promise<UserView> {
    const user = User.registerWithPassword(newUser);
    await this.users.save(user);
    return toView(user);
  }
}

function toView({ id, email, name }: User): UserView {
  return { id, email, name };
}
