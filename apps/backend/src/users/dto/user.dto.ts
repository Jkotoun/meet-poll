import { ApiProperty } from '@nestjs/swagger';
import type { User } from '../entities/user.entity.js';

export class UserDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty()
  name: string;

  static from({ id, email, name }: User): UserDto {
    return { id, email, name };
  }
}
