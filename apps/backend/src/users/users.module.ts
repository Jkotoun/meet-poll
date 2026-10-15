import { Module } from '@nestjs/common';
import { UsersService } from './application/users.service.js';
import { UserRepository } from './domain/user.repository.js';
import { MikroOrmUserRepository } from './infrastructure/persistence/mikro-orm-user.repository.js';

@Module({
  providers: [
    UsersService,
    { provide: UserRepository, useClass: MikroOrmUserRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}
