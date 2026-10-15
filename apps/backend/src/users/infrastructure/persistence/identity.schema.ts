import { defineEntity, p } from '@mikro-orm/postgresql';
import { Identity, IdentityProvider } from '../../domain/identity.js';
import { UserSchema } from './user.schema.js';

export const IdentitySchema = defineEntity({
  class: Identity,
  tableName: 'identities',
  uniques: [
    { properties: ['userId', 'provider'] },
    { properties: ['provider', 'providerSubject'] },
  ],
  checks: [
    {
      name: 'identities_credentials_check',
      expression:
        "(provider = 'password' and password_hash is not null and provider_subject is null) or " +
        "(provider = 'google' and provider_subject is not null and password_hash is null)",
    },
  ],
  properties: {
    id: p.uuid().primary(),
    userId: () =>
      p
        .manyToOne(UserSchema)
        .mapToPk()
        .fieldName('user_id')
        .deleteRule('cascade'),
    provider: p
      .enum(() => IdentityProvider)
      .nativeEnumName('identity_provider'),
    providerSubject: p.string().nullable(),
    passwordHash: p.string().nullable(),
    createdAt: p.datetime(),
  },
});
