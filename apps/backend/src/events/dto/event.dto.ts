import { ApiProperty } from '@nestjs/swagger';
import type { Event } from '../entities/event.entity.js';
import type { TimeSlot } from '../entities/time-slot.entity.js';
import { VoteChoice } from '../entities/vote.entity.js';
import { rankSlots } from '../ranking.js';

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

  @ApiProperty({
    description:
      'Position by how many can attend, then by yes votes; ties share a rank',
    example: 1,
  })
  rank: number;

  static from(slot: TimeSlot, viewerId: string, rank: number): TimeSlotDto {
    const { id, startsAt, endsAt, votes } = slot;
    return {
      id,
      startsAt,
      endsAt,
      ...countVotes(slot),
      myChoice:
        votes.getItems().find((vote) => vote.voter.id === viewerId)?.choice ??
        null,
      rank,
    };
  }
}

function countVotes({ votes }: TimeSlot) {
  const count = (choice: VoteChoice) =>
    votes.getItems().filter((vote) => vote.choice === choice).length;
  return {
    yes: count(VoteChoice.Yes),
    ifNeedBe: count(VoteChoice.IfNeedBe),
    no: count(VoteChoice.No),
  };
}

export class EventSummaryDto {
  @ApiProperty({ example: 'q3Vx_7bA0kLm' })
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty()
  finalized: boolean;

  static from({
    slug,
    title,
    createdAt,
    finalizedSlot,
  }: Event): EventSummaryDto {
    return { slug, title, createdAt, finalized: finalizedSlot !== null };
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

  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  finalizedSlotId: string | null;

  static from(
    {
      slug,
      title,
      timezone,
      createdAt,
      organizer,
      slots,
      finalizedSlot,
    }: Event,
    viewerId: string,
  ): EventDto {
    const items = slots.getItems();
    const ranks = rankSlots(items.map(countVotes));
    return {
      slug,
      title,
      timezone,
      createdAt,
      organizer: { id: organizer.id, name: organizer.name },
      slots: items.map((slot, i) => TimeSlotDto.from(slot, viewerId, ranks[i])),
      finalizedSlotId: finalizedSlot?.id ?? null,
    };
  }
}
