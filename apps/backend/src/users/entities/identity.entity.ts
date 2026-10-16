import {
  Check,
  Entity,
  Enum,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import type { Opt, Rel } from '@mikro-orm/postgresql';
import { User } from './user.entity.js';

export enum IdentityProvider {
  Password = 'password',
  Google = 'google',
}

@Entity({ tableName: 'identities' })
@Unique({ properties: ['user', 'provider'] })
@Unique({ properties: ['provider', 'providerSubject'] })
@Check({
  name: 'identities_credentials_check',
  expression:
    "(provider = 'password' and password_hash is not null and provider_subject is null) or " +
    "(provider = 'google' and provider_subject is not null and password_hash is null)",
})
export class Identity {
  @PrimaryKey({ type: 'uuid' })
  id: Opt<string> = Bun.randomUUIDv7();

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user: Rel<User>;

  @Enum({ items: () => IdentityProvider, nativeEnumName: 'identity_provider' })
  provider: IdentityProvider;

  @Property({ type: 'string', nullable: true })
  providerSubject?: string | null;

  @Property({ type: 'string', nullable: true })
  passwordHash?: string | null;

  @Property({ type: 'datetime' })
  createdAt: Opt<Date> = new Date();
}
