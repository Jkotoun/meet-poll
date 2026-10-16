import { randomBytes } from 'node:crypto';
import { defineEntity, type InferEntity, p } from '@mikro-orm/postgresql';
import { User } from '../../users/entities/user.entity.js';
import { TimeSlot } from './time-slot.entity.js';

export const Event = defineEntity({
  name: 'Event',
  tableName: 'events',
  properties: {
    id: p
      .uuid()
      .primary()
      .onCreate(() => Bun.randomUUIDv7()),
    // 72 random bits: unguessable, so the link is the invitation.
    slug: p
      .string()
      .length(12)
      .unique()
      .onCreate(() => randomBytes(9).toString('base64url')),
    title: p.string().length(200),
    timezone: p.string().length(64),
    organizer: () => p.manyToOne(User).deleteRule('cascade').index(),
    createdAt: p.datetime().onCreate(() => new Date()),
    finalizedSlot: () =>
      p.manyToOne(TimeSlot).nullable().deleteRule('set null').index(),
    slots: () =>
      p.oneToMany(TimeSlot).mappedBy('event').orderBy({ startsAt: 'asc' }),
  },
});

export type Event = InferEntity<typeof Event>;
