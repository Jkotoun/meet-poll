import { defineEntity, p } from '@mikro-orm/postgresql';
import { User } from '../../domain/user.js';
import { IdentitySchema } from './identity.schema.js';

export const USERS_EMAIL_UNIQUE = 'users_email_unique';

export const UserSchema = defineEntity({
  class: User,
  tableName: 'users',
  checks: [
    {
      name: 'users_email_normalized_check',
      expression: '(email)::text = lower(TRIM(BOTH FROM email))',
    },
  ],
  properties: {
    id: p.uuid().primary(),
    email: p.string().length(254).unique(USERS_EMAIL_UNIQUE),
    name: p.string().length(100),
    createdAt: p.datetime(),
    identities: () =>
      p.oneToMany(IdentitySchema).mappedBy('userId').orphanRemoval(),
  },
});
