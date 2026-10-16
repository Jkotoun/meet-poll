import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { VoteChoice } from '../entities/vote.entity.js';

export class VoteDto {
  @ApiProperty({ enum: VoteChoice, enumName: 'VoteChoice' })
  @IsEnum(VoteChoice)
  choice: VoteChoice;
}
