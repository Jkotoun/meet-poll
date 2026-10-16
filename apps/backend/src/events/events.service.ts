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
    const slot = await this.em.findOne(TimeSlot, {
      id: slotId,
      event: { slug },
    });
    if (!slot) {
      throw new ProblemException(SLOT_NOT_FOUND, 'This event has no such slot');
    }
    await this.em.upsert(Vote, { slot, voter, choice });
  }
}
