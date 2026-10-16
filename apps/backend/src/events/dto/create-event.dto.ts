import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsTimeZone,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { trim } from '../../common/transforms.js';
import { IsAfter } from './is-after.validator.js';
import { IsTimestamp } from './is-timestamp.validator.js';

const MAX_SLOTS = 50;

export class CreateTimeSlotDto {
  @ApiProperty({ format: 'date-time', example: '2026-11-02T09:00:00Z' })
  @IsTimestamp()
  startsAt: string;

  @ApiProperty({ format: 'date-time', example: '2026-11-02T10:00:00Z' })
  @IsTimestamp()
  @IsAfter('startsAt')
  endsAt: string;
}

export class CreateEventDto {
  @ApiProperty({ minLength: 1, maxLength: 200, example: 'Team lunch' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'IANA time zone', example: 'Europe/Prague' })
  @IsTimeZone()
  timezone: string;

  @ApiProperty({
    type: [CreateTimeSlotDto],
    minItems: 1,
    maxItems: MAX_SLOTS,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_SLOTS)
  @ValidateNested({ each: true })
  @Type(() => CreateTimeSlotDto)
  slots: CreateTimeSlotDto[];
}
