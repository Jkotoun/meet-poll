import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { nfkc, normalizedEmail } from './transforms.js';

export class LogInRequestDto {
  @ApiProperty({ example: 'ada@example.com' })
  @Transform(normalizedEmail)
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  email: string;

  @ApiProperty({ format: 'password', maxLength: 128 })
  @Transform(nfkc)
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}
