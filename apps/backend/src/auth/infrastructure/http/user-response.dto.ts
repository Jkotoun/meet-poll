import { ApiProperty } from '@nestjs/swagger';
import type { UserDto } from '../../../users/users.api.js';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty()
  name: string;

  static from({ id, email, name }: UserDto): UserResponseDto {
    return { id, email, name };
  }
}
