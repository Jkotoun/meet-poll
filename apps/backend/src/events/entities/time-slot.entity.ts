import {
  Check,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { Collection, type Opt, type Rel } from '@mikro-orm/postgresql';
import { Event } from './event.entity.js';
import { Vote } from './vote.entity.js';

@Entity({ tableName: 'time_slots' })
@Check({
  name: 'time_slots_ends_after_starts_check',
  expression: 'ends_at > starts_at',
})
export class TimeSlot {
  @PrimaryKey({ type: 'uuid' })
  id: Opt<string> = Bun.randomUUIDv7();

  @ManyToOne(() => Event, { deleteRule: 'cascade', index: true })
  event: Rel<Event>;

  @Property({ type: 'datetime' })
  startsAt: Date;

  @Property({ type: 'datetime' })
  endsAt: Date;

  @OneToMany(() => Vote, (vote) => vote.slot)
  votes = new Collection<Vote>(this);
}
