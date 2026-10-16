import { Entity, Enum, ManyToOne } from '@mikro-orm/decorators/legacy';
import { PrimaryKeyProp, type Rel } from '@mikro-orm/postgresql';
import { User } from '../../users/entities/user.entity.js';
import { TimeSlot } from './time-slot.entity.js';

export enum VoteChoice {
  Yes = 'yes',
  IfNeedBe = 'if_need_be',
  No = 'no',
}

// One row per slot and voter: the composite key is the one-vote rule.
@Entity({ tableName: 'votes' })
export class Vote {
  [PrimaryKeyProp]?: ['slot', 'voter'];

  @ManyToOne(() => TimeSlot, { primary: true, deleteRule: 'cascade' })
  slot: Rel<TimeSlot>;

  @ManyToOne(() => User, { primary: true, deleteRule: 'cascade', index: true })
  voter: Rel<User>;

  @Enum({ items: () => VoteChoice, nativeEnumName: 'vote_choice' })
  choice: VoteChoice;
}
