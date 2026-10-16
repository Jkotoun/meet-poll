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

export function formAlert(page: Page): Locator {
  return page.getByRole('main').getByRole('alert');
}

export function navBar(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Main' });
}
