import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { MikroORM } from '@mikro-orm/postgresql';
import { ProblemException } from '../src/http-errors/problem.exception.js';
import type { User } from '../src/users/entities/user.entity.js';
import {
  EMAIL_ALREADY_REGISTERED,
  UsersService,
} from '../src/users/users.service.js';
import { createTestApp, TestApp } from './support/test-app.js';

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

  function users(): UsersService {
    return new UsersService(orm.em.fork());
  }

  function createUser(email: string): Promise<User> {
    return users().createWithPassword({
      email,
      name: 'Ada',
      passwordHash: 'hash',
    });
  }

  function execute(sql: string, params: unknown[]): Promise<unknown> {
    return orm.em.getConnection().execute(sql, params);
  }

  it('saves a user with its password identity', async () => {
    const user = await createUser('ada@example.com');

    const loaded = await users().findByEmail('ada@example.com');

    expect(loaded).toMatchObject({ id: user.id, name: 'Ada' });
    expect(loaded?.identities.getItems()).toEqual([
      expect.objectContaining({ provider: 'password', passwordHash: 'hash' }),
    ]);
  });

  it('reports a taken email as a problem', async () => {
    await createUser('linus@example.com');

    const error = await rejectionOf(createUser('linus@example.com'));

    expect(error).toBeInstanceOf(ProblemException);
    expect(error).toMatchObject({ problemType: EMAIL_ALREADY_REGISTERED });
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
    const user = await createUser('edsger@example.com');

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
    const user = await createUser('barbara@example.com');

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
    const user = await createUser('margaret@example.com');

    await execute('delete from users where id = ?', [user.id]);

    const rows = await orm.em
      .getConnection()
      .execute('select id from identities where user_id = ?', [user.id]);
    expect(rows).toEqual([]);
  });
});
