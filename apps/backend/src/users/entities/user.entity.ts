import { defineEntity, type InferEntity, p } from '@mikro-orm/postgresql';
import { Identity } from './identity.entity.js';

export const USERS_EMAIL_UNIQUE = 'users_email_unique';

export const User = defineEntity({
  name: 'User',
  tableName: 'users',
  checks: [
    {
      name: 'users_email_normalized_check',
      expression: '(email)::text = lower(TRIM(BOTH FROM email))',
    },
  ],
  properties: {
    id: p
      .uuid()
      .primary()
      .onCreate(() => Bun.randomUUIDv7()),
    email: p.string().length(254).unique(USERS_EMAIL_UNIQUE),
    name: p.string().length(100),
    createdAt: p.datetime().onCreate(() => new Date()),
    identities: () => p.oneToMany(Identity).mappedBy('user'),
  },
});

export type User = InferEntity<typeof User>;
