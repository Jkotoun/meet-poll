import { describe, expect, it } from 'bun:test';
import { Identity, IdentityProvider } from './identity.js';
import { User } from './user.js';

const UUID_V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const now = new Date('2026-10-15T12:00:00Z');

describe('User', () => {
  it('normalizes the email and trims the name, however it is created', () => {
    const user = new User({
      id: Bun.randomUUIDv7(),
      email: '  Ada@Example.COM ',
      name: '  Ada Lovelace ',
      createdAt: now,
      identities: [],
    });

    expect(user.email).toBe('ada@example.com');
    expect(user.name).toBe('Ada Lovelace');
  });

  it('has no password hash without a password identity', () => {
    const user = new User({
      id: Bun.randomUUIDv7(),
      email: 'ada@example.com',
      name: 'Ada',
      createdAt: now,
      identities: [],
    });

    expect(user.passwordHash()).toBeNull();
  });
});

describe('User.registerWithPassword', () => {
  const user = User.registerWithPassword(
    { email: 'ada@example.com', name: 'Ada', passwordHash: 'hash' },
    now,
  );

  it('generates a UUIDv7 id', () => {
    expect(user.id).toMatch(UUID_V7);
  });

  it('owns a single password identity', () => {
    const identities = [...user.identities];

    expect(identities).toHaveLength(1);
    expect(identities[0]).toMatchObject({
      userId: user.id,
      provider: IdentityProvider.Password,
      providerSubject: null,
      passwordHash: 'hash',
      createdAt: now,
    });
    expect(identities[0].id).toMatch(UUID_V7);
    expect(user.passwordHash()).toBe('hash');
  });
});

describe('Identity', () => {
  const base = {
    id: Bun.randomUUIDv7(),
    userId: Bun.randomUUIDv7(),
    createdAt: now,
  };

  it('requires a hash and no subject for password identities', () => {
    expect(
      () =>
        new Identity({
          ...base,
          provider: IdentityProvider.Password,
          providerSubject: 'sub',
          passwordHash: null,
        }),
    ).toThrow(/password identity/);
  });

  it('requires a subject and no hash for Google identities', () => {
    expect(
      () =>
        new Identity({
          ...base,
          provider: IdentityProvider.Google,
          providerSubject: null,
          passwordHash: 'hash',
        }),
    ).toThrow(/google identity/);
  });
});
