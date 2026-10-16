import {
  Check,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { Collection, type Opt } from '@mikro-orm/postgresql';
import { Identity } from './identity.entity.js';

export const USERS_EMAIL_UNIQUE = 'users_email_unique';

@Entity({ tableName: 'users' })
@Check({
  name: 'users_email_normalized_check',
  expression: '(email)::text = lower(TRIM(BOTH FROM email))',
})
export class User {
  @PrimaryKey({ type: 'uuid' })
  id: Opt<string> = Bun.randomUUIDv7();

  @Property({ type: 'string', length: 254, unique: USERS_EMAIL_UNIQUE })
  email: string;

  @Property({ type: 'string', length: 100 })
  name: string;

  @Property({ type: 'datetime' })
  createdAt: Opt<Date> = new Date();

  @OneToMany(() => Identity, (identity) => identity.user)
  identities = new Collection<Identity>(this);
}
