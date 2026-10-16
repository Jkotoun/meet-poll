import { defineEntity, type InferEntity, p } from '@mikro-orm/postgresql';
import { Event } from './event.entity.js';

export const TimeSlot = defineEntity({
  name: 'TimeSlot',
  tableName: 'time_slots',
  checks: [
    {
      name: 'time_slots_ends_after_starts_check',
      expression: 'ends_at > starts_at',
    },
  ],
  properties: {
    id: p
      .uuid()
      .primary()
      .onCreate(() => Bun.randomUUIDv7()),
    event: () => p.manyToOne(Event).deleteRule('cascade').index(),
    startsAt: p.datetime(),
    endsAt: p.datetime(),
  },
});

export type TimeSlot = InferEntity<typeof TimeSlot>;
