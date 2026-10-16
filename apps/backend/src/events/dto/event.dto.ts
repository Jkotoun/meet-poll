import { ApiProperty } from '@nestjs/swagger';
import type { Event } from '../entities/event.entity.js';
import type { TimeSlot } from '../entities/time-slot.entity.js';
import { VoteChoice } from '../entities/vote.entity.js';

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

  @ApiProperty()
  yes: number;

  @ApiProperty()
  ifNeedBe: number;

  @ApiProperty()
  no: number;

  @ApiProperty({
    enum: VoteChoice,
    enumName: 'VoteChoice',
    nullable: true,
    description: "The viewer's own vote",
  })
  myChoice: VoteChoice | null;

  static from(
    { id, startsAt, endsAt, votes }: TimeSlot,
    viewerId: string,
  ): TimeSlotDto {
    const choices = votes.getItems();
    const count = (choice: VoteChoice) =>
      choices.filter((vote) => vote.choice === choice).length;
    return {
      id,
      startsAt,
      endsAt,
      yes: count(VoteChoice.Yes),
      ifNeedBe: count(VoteChoice.IfNeedBe),
      no: count(VoteChoice.No),
      myChoice:
        choices.find((vote) => vote.voter.id === viewerId)?.choice ?? null,
    };
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

// Expects `organizer` and `slots.votes` to be loaded.
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

  static from(
    { slug, title, timezone, createdAt, organizer, slots }: Event,
    viewerId: string,
  ): EventDto {
    return {
      slug,
      title,
      timezone,
      createdAt,
      organizer: { id: organizer.id, name: organizer.name },
      slots: slots.getItems().map((slot) => TimeSlotDto.from(slot, viewerId)),
    };
  }
}
