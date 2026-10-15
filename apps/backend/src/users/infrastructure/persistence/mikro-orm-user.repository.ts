import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { normalizeEmail } from '../../domain/email.js';
import { User } from '../../domain/user.js';
import { UserRepository } from '../../domain/user.repository.js';
import { UserSchema } from './user.schema.js';

@Injectable()
export class MikroOrmUserRepository extends UserRepository {
  constructor(private readonly em: EntityManager) {
    super();
  }

  async save(user: User): Promise<void> {
    await this.em.persist(user).flush();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.em.findOne(
      UserSchema,
      { email: normalizeEmail(email) },
      { populate: ['identities'] },
    );
  }
}
