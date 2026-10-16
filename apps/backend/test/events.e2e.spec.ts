import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import request from 'supertest';
import { Account, registerAccount } from './support/accounts.js';
import { createTestApp, TestApp } from './support/test-app.js';

const slots = [
  { startsAt: '2026-11-03T09:00:00Z', endsAt: '2026-11-03T10:00:00Z' },
  {
    startsAt: '2026-11-02T09:00:00+01:00',
    endsAt: '2026-11-02T10:30:00+01:00',
  },
];

function newEvent(overrides: object = {}) {
  return {
    title: 'Team lunch',
    timezone: 'Europe/Prague',
    slots,
    ...overrides,
  };
}

describe('Events (e2e)', () => {
  let testApp: TestApp;
  let ada: Account;

  beforeAll(async () => {
    testApp = await createTestApp();
    ada = await registerAccount(server(), 'Ada');
  });

  afterAll(async () => {
    await testApp.close();
  });

  function server() {
    return testApp.app.getHttpServer();
  }

  function createEvent(account: Account, body: object = newEvent()) {
    return request(server())
      .post('/v1/events')
      .set('Cookie', account.cookie)
      .send(body);
  }

  function getEvent(account: Account, slug: string) {
    return request(server())
      .get(`/v1/events/${slug}`)
      .set('Cookie', account.cookie);
  }

  function pointersOf(response: request.Response): string[] {
    return response.body.errors.map(
      (error: { pointer: string }) => error.pointer,
    );
  }

  it('creates an event that anyone signed in can open by its slug', async () => {
    const created = await createEvent(ada).expect(201);
    const grace = await registerAccount(server(), 'Grace');

    const response = await getEvent(grace, created.body.slug).expect(200);

    expect(response.body).toEqual(created.body);
    expect(response.body).toEqual({
      slug: expect.stringMatching(/^[\w-]{12}$/),
      title: 'Team lunch',
      timezone: 'Europe/Prague',
      createdAt: expect.any(String),
      organizer: { id: ada.id, name: 'Ada' },
      slots: [
        {
          id: expect.any(String),
          startsAt: '2026-11-02T08:00:00.000Z',
          endsAt: '2026-11-02T09:30:00.000Z',
        },
        {
          id: expect.any(String),
          startsAt: '2026-11-03T09:00:00.000Z',
          endsAt: '2026-11-03T10:00:00.000Z',
        },
      ],
    });
  });

  it('trims the title', async () => {
    const response = await createEvent(
      ada,
      newEvent({ title: '  Retro  ' }),
    ).expect(201);

    expect(response.body.title).toBe('Retro');
  });

  it('lists only my events, newest first', async () => {
    const linus = await registerAccount(server(), 'Linus');
    const first = await createEvent(linus, newEvent({ title: 'First' }));
    const second = await createEvent(linus, newEvent({ title: 'Second' }));
    await createEvent(ada);

    const response = await request(server())
      .get('/v1/events')
      .set('Cookie', linus.cookie)
      .expect(200);

    expect(response.body).toEqual([
      {
        slug: second.body.slug,
        title: 'Second',
        createdAt: second.body.createdAt,
      },
      {
        slug: first.body.slug,
        title: 'First',
        createdAt: first.body.createdAt,
      },
    ]);
  });

  it('rejects a slot that does not end after it starts', async () => {
    const response = await createEvent(
      ada,
      newEvent({
        slots: [
          { startsAt: '2026-11-02T10:00:00Z', endsAt: '2026-11-02T10:00:00Z' },
        ],
      }),
    ).expect(400);

    expect(response.body.errors).toEqual([
      { pointer: '#/slots/0/endsAt', detail: 'endsAt must be after startsAt' },
    ]);
  });

  it('rejects an event without slots, a timestamp without offset and an unknown time zone', async () => {
    const noSlots = await createEvent(
      ada,
      newEvent({ slots: [], timezone: 'Mars/Olympus' }),
    ).expect(400);
    const noOffset = await createEvent(
      ada,
      newEvent({
        slots: [
          { startsAt: '2026-11-02T09:00:00', endsAt: '2026-11-02T10:00:00Z' },
        ],
      }),
    ).expect(400);

    expect(pointersOf(noSlots)).toEqual(['#/timezone', '#/slots']);
    expect(pointersOf(noOffset)).toContain('#/slots/0/startsAt');
  });

  it('requires a session', async () => {
    const { body } = await createEvent(ada).expect(201);

    await request(server()).post('/v1/events').send(newEvent()).expect(401);
    await request(server()).get('/v1/events').expect(401);
    await request(server()).get(`/v1/events/${body.slug}`).expect(401);
  });

  it('stores the canonical time zone name', async () => {
    const response = await createEvent(
      ada,
      newEvent({ timezone: 'europe/prague' }),
    ).expect(201);

    expect(response.body.timezone).toBe('Europe/Prague');
  });

  it.each([
    ['an impossible date', '2026-02-30T09:00:00Z'],
    ['a year outside 2000–2100', '0000-01-01T00:00:00Z'],
  ])('rejects %s', async (_case, startsAt) => {
    const response = await createEvent(
      ada,
      newEvent({ slots: [{ startsAt, endsAt: '2026-11-02T10:00:00Z' }] }),
    ).expect(400);

    expect(pointersOf(response)).toContain('#/slots/0/startsAt');
  });

  it('rejects a blank title and more than 50 slots', async () => {
    const response = await createEvent(
      ada,
      newEvent({ title: '   ', slots: Array(51).fill(slots[0]) }),
    ).expect(400);

    expect(pointersOf(response)).toEqual(['#/title', '#/slots']);
  });

  it('answers an unknown slug with a typed 404', async () => {
    const response = await getEvent(ada, 'nonexistent0').expect(404);

    expect(response.body).toMatchObject({
      type: '/problems/event-not-found',
      title: 'Event not found',
    });
  });
});
