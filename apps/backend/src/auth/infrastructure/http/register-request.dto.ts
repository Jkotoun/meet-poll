import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { normalizeEmail } from '../../../users/users.api.js';

const NO_CONTROL_CHARACTERS = /^\P{Cc}*$/u;
const HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

// Validate what will be stored: lowercasing can change the length.
const normalizedEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? normalizeEmail(value) : value;
const trimmed = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
// Length limits apply to the form that gets hashed.
const nfkc = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.normalize('NFKC') : value;

export class RegisterRequestDto {
  @ApiProperty({ format: 'email', maxLength: 254, example: 'ada@example.com' })
  @Transform(normalizedEmail)
  @IsEmail()
  @MaxLength(254)
  @Matches(NO_CONTROL_CHARACTERS, {
    message: 'email must not contain control characters',
  })
  email: string;

  @ApiProperty({ minLength: 1, maxLength: 100, example: 'Ada Lovelace' })
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(NO_CONTROL_CHARACTERS, {
    message: 'name must not contain control characters',
  })
  @Matches(HAS_LETTER_OR_DIGIT, {
    message: 'name must contain a letter or digit',
  })
  name: string;

  @ApiProperty({ minLength: 8, maxLength: 128, format: 'password' })
  @Transform(nfkc)
  @Length(8, 128)
  password: string;
}
