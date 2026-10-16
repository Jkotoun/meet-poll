import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import request from 'supertest';
import { Account, registerAccount } from './support/accounts.js';
import { createTestApp, TestApp } from './support/test-app.js';

interface Slot {
  id: string;
  yes: number;
  ifNeedBe: number;
  no: number;
  myChoice: string | null;
}

describe('Votes (e2e)', () => {
  let testApp: TestApp;
  let ada: Account;
  let grace: Account;

  beforeAll(async () => {
    testApp = await createTestApp();
    ada = await registerAccount(server(), 'Ada');
    grace = await registerAccount(server(), 'Grace');
  });

  afterAll(async () => {
    await testApp.close();
  });

  function server() {
    return testApp.app.getHttpServer();
  }

  async function createEvent(): Promise<{ slug: string; slots: Slot[] }> {
    const response = await request(server())
      .post('/v1/events')
      .set('Cookie', ada.cookie)
      .send({
        title: 'Team lunch',
        timezone: 'Europe/Prague',
        slots: [
          { startsAt: '2026-11-02T11:00:00Z', endsAt: '2026-11-02T12:00:00Z' },
          { startsAt: '2026-11-03T11:00:00Z', endsAt: '2026-11-03T12:00:00Z' },
        ],
      })
      .expect(201);
    return response.body;
  }

  function vote(
    account: Account,
    slug: string,
    slotId: string,
    choice: string,
  ) {
    return request(server())
      .put(`/v1/events/${slug}/slots/${slotId}/vote`)
      .set('Cookie', account.cookie)
      .send({ choice });
  }

  async function slotsSeenBy(account: Account, slug: string): Promise<Slot[]> {
    const response = await request(server())
      .get(`/v1/events/${slug}`)
      .set('Cookie', account.cookie)
      .expect(200);
    return response.body.slots;
  }

  it('starts every slot with no votes', async () => {
    const event = await createEvent();

    expect(event.slots[0]).toMatchObject({
      yes: 0,
      ifNeedBe: 0,
      no: 0,
      myChoice: null,
    });
  });

  it('counts votes per slot and shows each viewer their own choice', async () => {
    const { slug, slots } = await createEvent();
    await vote(ada, slug, slots[0].id, 'yes').expect(204);
    await vote(grace, slug, slots[0].id, 'if_need_be').expect(204);
    await vote(grace, slug, slots[1].id, 'no').expect(204);

    const [first, second] = await slotsSeenBy(grace, slug);

    expect(first).toMatchObject({
      yes: 1,
      ifNeedBe: 1,
      no: 0,
      myChoice: 'if_need_be',
    });
    expect(second).toMatchObject({
      yes: 0,
      ifNeedBe: 0,
      no: 1,
      myChoice: 'no',
    });
    expect((await slotsSeenBy(ada, slug))[0].myChoice).toBe('yes');
  });

  it('replaces an earlier vote on the same slot', async () => {
    const { slug, slots } = await createEvent();
    await vote(grace, slug, slots[0].id, 'no').expect(204);
    await vote(grace, slug, slots[0].id, 'yes').expect(204);

    const [first] = await slotsSeenBy(grace, slug);

    expect(first).toMatchObject({ yes: 1, no: 0, myChoice: 'yes' });
  });

  it('answers a slot of another event with a typed 404', async () => {
    const { slug } = await createEvent();
    const other = await createEvent();

    const response = await vote(grace, slug, other.slots[0].id, 'yes').expect(
      404,
    );

    expect(response.body.type).toBe('/problems/slot-not-found');
  });

  it('rejects an unknown choice and a malformed slot id', async () => {
    const { slug, slots } = await createEvent();

    await vote(grace, slug, slots[0].id, 'maybe').expect(400);
    await vote(grace, slug, 'not-a-uuid', 'yes').expect(400);
  });

  it('requires a session', async () => {
    const { slug, slots } = await createEvent();

    await request(server())
      .put(`/v1/events/${slug}/slots/${slots[0].id}/vote`)
      .send({ choice: 'yes' })
      .expect(401);
  });
});
