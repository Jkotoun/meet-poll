import { EntityManager } from '@mikro-orm/postgresql';
import { HttpStatus, Injectable } from '@nestjs/common';
import { isUniqueViolation } from '../database/unique-violation.js';
import {
  ProblemException,
  ProblemType,
} from '../http-errors/problem.exception.js';
import { Identity, IdentityProvider } from './entities/identity.entity.js';
import { User, USERS_EMAIL_UNIQUE } from './entities/user.entity.js';

export const EMAIL_ALREADY_REGISTERED: ProblemType = {
  status: HttpStatus.CONFLICT,
  code: 'email-already-registered',
  title: 'Email already registered',
};

interface NewPasswordUser {
  email: string;
  name: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  async createWithPassword({
    email,
    name,
    passwordHash,
  }: NewPasswordUser): Promise<User> {
    const user = this.em.create(User, { email, name });
    this.em.create(Identity, {
      user,
      provider: IdentityProvider.Password,
      passwordHash,
    });
    try {
      await this.em.flush();
    } catch (error) {
      // The unique index, not a pre-check, catches two registrations racing.
      if (isUniqueViolation(error, USERS_EMAIL_UNIQUE)) {
        throw new ProblemException(
          EMAIL_ALREADY_REGISTERED,
          'An account with this email already exists',
        );
      }
      throw error;
    }
    return user;
  }

  findById(id: string): Promise<User | null> {
    return this.em.findOne(User, { id });
  }

  findByEmail(email: string) {
    return this.em.findOne(User, { email }, { populate: ['identities'] });
  }
}
