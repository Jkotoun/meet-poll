import { ApiProperty } from '@nestjs/swagger';
import type { Event } from '../entities/event.entity.js';
import type { TimeSlot } from '../entities/time-slot.entity.js';

export class OrganizerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;
}

export class TimeSlotDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'date-time' })
  startsAt: Date;

  @ApiProperty({ format: 'date-time' })
  endsAt: Date;

  static from({ id, startsAt, endsAt }: TimeSlot): TimeSlotDto {
    return { id, startsAt, endsAt };
  }
}

export class EventSummaryDto {
  @ApiProperty({ example: 'q3Vx_7bA0kLm' })
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  static from({ slug, title, createdAt }: Event): EventSummaryDto {
    return { slug, title, createdAt };
  }
}

// Expects `organizer` and `slots` to be loaded.
export class EventDto {
  @ApiProperty({ example: 'q3Vx_7bA0kLm' })
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ example: 'Europe/Prague' })
  timezone: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty()
  organizer: OrganizerDto;

  @ApiProperty({ type: [TimeSlotDto] })
  slots: TimeSlotDto[];

  static from({
    slug,
    title,
    timezone,
    createdAt,
    organizer,
    slots,
  }: Event): EventDto {
    return {
      slug,
      title,
      timezone,
      createdAt,
      organizer: { id: organizer.id, name: organizer.name },
      slots: slots.getItems().map((slot) => TimeSlotDto.from(slot)),
    };
  }
}
