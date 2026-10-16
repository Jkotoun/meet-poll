import { randomBytes } from 'node:crypto';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { Collection, type Opt, type Rel } from '@mikro-orm/postgresql';
import { User } from '../../users/entities/user.entity.js';
import { TimeSlot } from './time-slot.entity.js';

@Entity({ tableName: 'events' })
export class Event {
  @PrimaryKey({ type: 'uuid' })
  id: Opt<string> = Bun.randomUUIDv7();

  // 72 random bits: unguessable, so the link is the invitation.
  @Property({ type: 'string', length: 12, unique: true })
  slug: Opt<string> = randomBytes(9).toString('base64url');

  @Property({ type: 'string', length: 200 })
  title: string;

  @Property({ type: 'string', length: 64 })
  timezone: string;

  @ManyToOne(() => User, { deleteRule: 'cascade', index: true })
  organizer: Rel<User>;

  @Property({ type: 'datetime' })
  createdAt: Opt<Date> = new Date();

  @ManyToOne(() => TimeSlot, {
    nullable: true,
    deleteRule: 'set null',
    index: true,
  })
  finalizedSlot?: Rel<TimeSlot> | null;

  @OneToMany(() => TimeSlot, (slot) => slot.event, {
    orderBy: { startsAt: 'asc' },
  })
  slots = new Collection<TimeSlot>(this);
}
