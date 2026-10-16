import { defineEntity, type InferEntity, p } from '@mikro-orm/postgresql';
import { User } from '../../users/entities/user.entity.js';
import { TimeSlot } from './time-slot.entity.js';

export enum VoteChoice {
  Yes = 'yes',
  IfNeedBe = 'if_need_be',
  No = 'no',
}

// One row per slot and voter: the composite key is the one-vote rule.
export const Vote = defineEntity({
  name: 'Vote',
  tableName: 'votes',
  properties: {
    slot: () => p.manyToOne(TimeSlot).primary().deleteRule('cascade'),
    voter: () => p.manyToOne(User).primary().deleteRule('cascade').index(),
    choice: p.enum(() => VoteChoice).nativeEnumName('vote_choice'),
  },
});

export type Vote = InferEntity<typeof Vote>;
