import { EntityManager } from '@mikro-orm/postgresql';
import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ProblemException,
  ProblemType,
} from '../http-errors/problem.exception.js';
import type { User } from '../users/entities/user.entity.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { Event } from './entities/event.entity.js';
import { TimeSlot } from './entities/time-slot.entity.js';
import { Vote, VoteChoice } from './entities/vote.entity.js';

export const EVENT_NOT_FOUND: ProblemType = {
  status: HttpStatus.NOT_FOUND,
  code: 'event-not-found',
  title: 'Event not found',
};

export const SLOT_NOT_FOUND: ProblemType = {
  status: HttpStatus.NOT_FOUND,
  code: 'slot-not-found',
  title: 'Slot not found',
};

export const NOT_ORGANIZER: ProblemType = {
  status: HttpStatus.FORBIDDEN,
  code: 'not-organizer',
  title: 'Only the organizer can do this',
};

export const EVENT_FINALIZED: ProblemType = {
  status: HttpStatus.CONFLICT,
  code: 'event-finalized',
  title: 'Event already finalized',
};

@Injectable()
export class EventsService {
  constructor(private readonly em: EntityManager) {}

  async create(
    organizer: User,
    { title, timezone, slots }: CreateEventDto,
  ): Promise<Event> {
    const event = this.em.create(Event, {
      title,
      // Canonical spelling ("europe/prague" → "Europe/Prague") for display.
      timezone: new Intl.DateTimeFormat('en', {
        timeZone: timezone,
      }).resolvedOptions().timeZone,
      organizer,
      slots: slots
        .map(({ startsAt, endsAt }) => ({
          startsAt: new Date(startsAt),
          endsAt: new Date(endsAt),
        }))
        // Same order as a loaded event, whose slots are sorted by start.
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
    });
    await this.em.flush();
    return event;
  }

  async findBySlug(slug: string): Promise<Event> {
    const event = await this.em.findOne(
      Event,
      { slug },
      { populate: ['organizer', 'slots.votes'] },
    );
    if (!event) {
      throw new ProblemException(
        EVENT_NOT_FOUND,
        'No event exists at this link',
      );
    }
    return event;
  }

  findOrganizedBy(organizer: User): Promise<Event[]> {
    return this.em.find(
      Event,
      { organizer },
      { orderBy: { createdAt: 'desc' } },
    );
  }

  async vote(
    voter: User,
    slug: string,
    slotId: string,
    choice: VoteChoice,
  ): Promise<void> {
    const slot = await this.findSlot(slug, slotId);
    // A read, not a lock: a vote racing the finalize may land, which is
    // harmless since the pick is already made.
    if (slot.event.finalizedSlot) {
      throw new ProblemException(
        EVENT_FINALIZED,
        'Voting has closed: the organizer picked a time',
      );
    }
    await this.em.upsert(Vote, { slot, voter, choice });
  }

  async finalize(user: User, slug: string, slotId: string): Promise<void> {
    const slot = await this.findSlot(slug, slotId);
    const event = slot.event;
    if (event.organizer.id !== user.id) {
      throw new ProblemException(
        NOT_ORGANIZER,
        'Only the organizer can pick the final time',
      );
    }
    // One conditional update: repeating the same pick is a no-op, and of two
    // racing picks only the first can match.
    const updated = await this.em.nativeUpdate(
      Event,
      {
        id: event.id,
        $or: [{ finalizedSlot: null }, { finalizedSlot: slot.id }],
      },
      { finalizedSlot: slot.id },
    );
    if (updated === 0) {
      throw new ProblemException(
        EVENT_FINALIZED,
        'The organizer already picked another time',
      );
    }
  }

  private async findSlot(slug: string, slotId: string): Promise<TimeSlot> {
    const slot = await this.em.findOne(
      TimeSlot,
      { id: slotId, event: { slug } },
      { populate: ['event'] },
    );
    if (!slot) {
      throw new ProblemException(SLOT_NOT_FOUND, 'This event has no such slot');
    }
    return slot;
  }
}
