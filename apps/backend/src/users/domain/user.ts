import { normalizeEmail } from './email.js';
import { Identity, IdentityProvider } from './identity.js';

export interface UserProps {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  identities: Identity[];
}

export interface NewPasswordUser {
  email: string;
  name: string;
  passwordHash: string;
}

export class User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly createdAt: Date;
  // Loaded users get the ORM's collection here, so only iteration is promised.
  readonly identities: Iterable<Identity>;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = normalizeEmail(props.email);
    this.name = props.name.trim();
    this.createdAt = props.createdAt;
    this.identities = props.identities;
  }

  static registerWithPassword(
    { email, name, passwordHash }: NewPasswordUser,
    now = new Date(),
  ): User {
    const id = Bun.randomUUIDv7();
    return new User({
      id,
      email,
      name,
      createdAt: now,
      identities: [Identity.password(id, passwordHash, now)],
    });
  }

  passwordHash(): string | null {
    for (const identity of this.identities) {
      if (identity.provider === IdentityProvider.Password) {
        return identity.passwordHash;
      }
    }
    return null;
  }
}
