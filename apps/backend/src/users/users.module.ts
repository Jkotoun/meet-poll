import { Module } from '@nestjs/common';
import { UserRepository } from './domain/user.repository.js';
import { MikroOrmUserRepository } from './infrastructure/persistence/mikro-orm-user.repository.js';

@Module({
  providers: [{ provide: UserRepository, useClass: MikroOrmUserRepository }],
  exports: [UserRepository],
})
export class UsersModule {}
