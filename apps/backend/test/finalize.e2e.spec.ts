import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import request from 'supertest';
import { Account, registerAccount } from './support/accounts.js';
import { createTestApp, TestApp } from './support/test-app.js';

interface Event {
  slug: string;
  finalizedSlotId: string | null;
  slots: { id: string; rank: number }[];
}

describe('Ranking and finalize (e2e)', () => {
  let testApp: TestApp;
  let ada: Account;
  let grace: Account;
  let linus: Account;

  beforeAll(async () => {
    testApp = await createTestApp();
    ada = await registerAccount(server(), 'Ada');
    grace = await registerAccount(server(), 'Grace');
    linus = await registerAccount(server(), 'Linus');
  });

  afterAll(async () => {
    await testApp.close();
  });

  function server() {
    return testApp.app.getHttpServer();
  }

  async function createEvent(): Promise<Event> {
    const response = await request(server())
      .post('/v1/events')
      .set('Cookie', ada.cookie)
      .send({
        title: 'Team lunch',
        timezone: 'Europe/Prague',
        slots: [
          { startsAt: '2026-11-02T11:00:00Z', endsAt: '2026-11-02T12:00:00Z' },
          { startsAt: '2026-11-03T11:00:00Z', endsAt: '2026-11-03T12:00:00Z' },
          { startsAt: '2026-11-04T11:00:00Z', endsAt: '2026-11-04T12:00:00Z' },
        ],
      })
      .expect(201);
    return response.body;
  }

  async function getEvent(slug: string): Promise<Event> {
    const response = await request(server())
      .get(`/v1/events/${slug}`)
      .set('Cookie', ada.cookie)
      .expect(200);
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

  function finalize(account: Account, slug: string, slotId: string) {
    return request(server())
      .post(`/v1/events/${slug}/finalize`)
      .set('Cookie', account.cookie)
      .send({ slotId });
  }

  it('ranks slots by attendance, then by yes votes', async () => {
    const { slug, slots } = await createEvent();
    await vote(grace, slug, slots[0].id, 'if_need_be').expect(204);
    await vote(linus, slug, slots[0].id, 'if_need_be').expect(204);
    await vote(grace, slug, slots[1].id, 'yes').expect(204);
    await vote(linus, slug, slots[1].id, 'if_need_be').expect(204);
    await vote(grace, slug, slots[2].id, 'yes').expect(204);

    const event = await getEvent(slug);

    expect(event.slots.map((slot) => slot.rank)).toEqual([2, 1, 3]);
  });

  it('lets the organizer pick a slot, idempotently', async () => {
    const { slug, slots } = await createEvent();

    await finalize(ada, slug, slots[1].id).expect(204);
    await finalize(ada, slug, slots[1].id).expect(204);

    expect((await getEvent(slug)).finalizedSlotId).toBe(slots[1].id);
    const mine = await request(server())
      .get('/v1/events')
      .set('Cookie', ada.cookie)
      .expect(200);
    expect(
      mine.body.find((event: Event) => event.slug === slug).finalized,
    ).toBe(true);
  });

  it('does not let the organizer change the pick', async () => {
    const { slug, slots } = await createEvent();
    await finalize(ada, slug, slots[0].id).expect(204);

    const response = await finalize(ada, slug, slots[1].id).expect(409);

    expect(response.body.type).toBe('/problems/event-finalized');
    expect((await getEvent(slug)).finalizedSlotId).toBe(slots[0].id);
  });

  it('closes voting once finalized', async () => {
    const { slug, slots } = await createEvent();
    await finalize(ada, slug, slots[0].id).expect(204);

    const response = await vote(grace, slug, slots[1].id, 'yes').expect(409);

    expect(response.body.type).toBe('/problems/event-finalized');
  });

  it('only lets the organizer finalize', async () => {
    const { slug, slots } = await createEvent();

    const response = await finalize(grace, slug, slots[0].id).expect(403);

    expect(response.body.type).toBe('/problems/not-organizer');
    expect((await getEvent(slug)).finalizedSlotId).toBeNull();
    await finalize(ada, slug, slots[0].id).expect(204);
    await finalize(grace, slug, slots[0].id).expect(403);
  });

  it('rejects a slot of another event', async () => {
    const { slug } = await createEvent();
    const other = await createEvent();

    await finalize(ada, slug, other.slots[0].id).expect(404);
    await finalize(ada, slug, 'not-a-uuid').expect(400);
  });

  it('keeps one pick when two different picks race', async () => {
    const { slug, slots } = await createEvent();

    const statuses = await Promise.all([
      finalize(ada, slug, slots[0].id).then((response) => response.status),
      finalize(ada, slug, slots[1].id).then((response) => response.status),
    ]);

    expect(statuses.sort()).toEqual([204, 409]);
  });
});
