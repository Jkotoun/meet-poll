import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const PROBLEM_JSON = 'application/problem+json';
export const ABOUT_BLANK = 'about:blank';

export class InvalidFieldDto {
  @ApiProperty({ example: '#/title' })
  pointer: string;

  @ApiProperty({ example: 'title should not be empty' })
  detail: string;
}

export class ProblemDetailsDto {
  @ApiProperty({ example: ABOUT_BLANK })
  type: string;

  @ApiProperty({ example: 'Bad Request' })
  title: string;

  @ApiProperty({ example: 400 })
  status: number;

  @ApiPropertyOptional({ example: 'Request validation failed' })
  detail?: string;

  @ApiProperty({ example: '/v1/events' })
  instance: string;

  @ApiPropertyOptional({ type: [InvalidFieldDto] })
  errors?: InvalidFieldDto[];
}
