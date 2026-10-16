import { defineEntity, type InferEntity, p } from '@mikro-orm/postgresql';
import { User } from './user.entity.js';

export enum IdentityProvider {
  Password = 'password',
  Google = 'google',
}

export const Identity = defineEntity({
  name: 'Identity',
  tableName: 'identities',
  uniques: [
    { properties: ['user', 'provider'] },
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
    id: p
      .uuid()
      .primary()
      .onCreate(() => Bun.randomUUIDv7()),
    user: () => p.manyToOne(User).deleteRule('cascade'),
    provider: p
      .enum(() => IdentityProvider)
      .nativeEnumName('identity_provider'),
    providerSubject: p.string().nullable(),
    passwordHash: p.string().nullable(),
    createdAt: p.datetime().onCreate(() => new Date()),
  },
});

export type Identity = InferEntity<typeof Identity>;
