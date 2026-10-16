import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { MikroORM } from '@mikro-orm/postgresql';
import {
  EMAIL_ALREADY_REGISTERED,
  EmailAlreadyRegisteredError,
} from '../src/users/domain/email-already-registered.error.js';
import { User } from '../src/users/domain/user.js';
import { MikroOrmUserRepository } from '../src/users/infrastructure/persistence/mikro-orm-user.repository.js';
import { createTestApp, TestApp } from './support/test-app.js';

function newUser(email: string): User {
  return User.registerWithPassword({
    email,
    name: 'Ada',
    passwordHash: 'hash',
  });
}

function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => undefined,
    (error: unknown) => error,
  );
}

describe('Users persistence (e2e)', () => {
  let testApp: TestApp;
  let orm: MikroORM;

  beforeAll(async () => {
    testApp = await createTestApp();
    orm = testApp.app.get(MikroORM);
  });

  afterAll(async () => {
    await testApp.close();
  });

  function repository(): MikroOrmUserRepository {
    return new MikroOrmUserRepository(orm.em.fork());
  }

  function execute(sql: string, params: unknown[]): Promise<unknown> {
    return orm.em.getConnection().execute(sql, params);
  }

  describe('MikroOrmUserRepository', () => {
    it('saves a user with its identities and loads them back', async () => {
      const user = newUser('ada@example.com');
      await repository().save(user);

      const loaded = await repository().findByEmail('ada@example.com');

      expect(loaded).toMatchObject({
        id: user.id,
        email: 'ada@example.com',
        name: 'Ada',
        createdAt: user.createdAt,
      });
      expect(loaded?.passwordHash()).toBe('hash');
    });

    it('finds users by email regardless of case and whitespace', async () => {
      await repository().save(newUser('grace@example.com'));

      const loaded = await repository().findByEmail(' Grace@Example.com ');

      expect(loaded?.email).toBe('grace@example.com');
    });

    it('reports a taken email as a domain error', async () => {
      await repository().save(newUser('linus@example.com'));

      const error = await rejectionOf(
        repository().save(newUser('Linus@Example.com')),
      );

      expect(error).toBeInstanceOf(EmailAlreadyRegisteredError);
      expect(error).toMatchObject({
        name: 'EmailAlreadyRegisteredError',
        type: EMAIL_ALREADY_REGISTERED,
      });
    });

    it('returns null for an unknown email', async () => {
      expect(await repository().findByEmail('nobody@example.com')).toBeNull();
    });
  });

  describe('schema constraints', () => {
    it('enforces one user per email', async () => {
      const user = newUser('alan@example.com');
      await repository().save(user);

      const error = await rejectionOf(
        execute(
          `insert into users (id, email, name, created_at) values (?, ?, 'Alan', now())`,
          [Bun.randomUUIDv7(), user.email],
        ),
      );

      expect(String(error)).toContain('users_email_unique');
    });

    it('rejects an email that is not normalized', async () => {
      const error = await rejectionOf(
        execute(
          `insert into users (id, email, name, created_at) values (?, ?, 'Ada', now())`,
          [Bun.randomUUIDv7(), 'Ada@Example.com'],
        ),
      );

      expect(String(error)).toContain('users_email_normalized_check');
    });

    it('rejects an identity without the credentials its provider needs', async () => {
      const user = newUser('edsger@example.com');
      await repository().save(user);

      const error = await rejectionOf(
        execute(
          `insert into identities (id, user_id, provider, created_at)
           values (?, ?, 'google', now())`,
          [Bun.randomUUIDv7(), user.id],
        ),
      );

      expect(String(error)).toContain('identities_credentials_check');
    });

    it('rejects a second identity for the same provider and user', async () => {
      const user = newUser('barbara@example.com');
      await repository().save(user);

      const error = await rejectionOf(
        execute(
          `insert into identities (id, user_id, provider, password_hash, created_at)
           values (?, ?, 'password', 'other', now())`,
          [Bun.randomUUIDv7(), user.id],
        ),
      );

      expect(String(error)).toContain('identities_user_id_provider_unique');
    });

    it('deletes identities with their user', async () => {
      const user = newUser('margaret@example.com');
      await repository().save(user);

      await execute('delete from users where id = ?', [user.id]);

      const rows = await orm.em
        .getConnection()
        .execute('select id from identities where user_id = ?', [user.id]);
      expect(rows).toEqual([]);
    });
  });
});
