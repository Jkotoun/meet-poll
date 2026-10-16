import {
  expect,
  type APIRequestContext,
  type Locator,
  type Page,
} from '@playwright/test';

export { expect, test } from '@playwright/test';

export const PASSWORD = 'correct horse battery';

export function newEmail(): string {
  return `${crypto.randomUUID()}@example.com`;
}

// With `page.request` the page shares the cookie jar, so it is signed in afterwards.
export async function registerViaApi(
  request: APIRequestContext,
  { email = newEmail(), name = 'Ada Lovelace' } = {},
): Promise<string> {
  const response = await request.post('/api/v1/auth/register', {
    data: { email, name, password: PASSWORD },
  });
  expect(response.status()).toBe(201);
  return email;
}

// Two slots on Monday 2 November 2026, 12:00 and 14:00 in Prague.
export async function createEventViaApi(
  request: APIRequestContext,
  title = 'Team lunch',
): Promise<string> {
  const response = await request.post('/api/v1/events', {
    data: {
      title,
      timezone: 'Europe/Prague',
      slots: [
        { startsAt: '2026-11-02T11:00:00Z', endsAt: '2026-11-02T12:00:00Z' },
        { startsAt: '2026-11-02T13:00:00Z', endsAt: '2026-11-02T14:00:00Z' },
      ],
    },
  });
  expect(response.status()).toBe(201);
  const { slug } = (await response.json()) as { slug: string };
  return `/events/${slug}`;
}

export function formAlert(page: Page): Locator {
  return page.getByRole('main').getByRole('alert');
}

export function navBar(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Main' });
}
