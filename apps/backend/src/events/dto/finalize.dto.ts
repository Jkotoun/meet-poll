import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FinalizeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  slotId: string;
}
