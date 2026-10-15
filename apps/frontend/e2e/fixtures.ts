import {
  test as base,
  expect,
  type APIRequestContext,
  type Locator,
  type Page,
} from '@playwright/test';

export { expect };

export const PASSWORD = 'correct horse battery';

function randomIp(): string {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  return `10.${octet()}.${octet()}.${octet()}`;
}

// Each test appears as its own client, so the per-IP rate limits don't add up.
export const test = base.extend<{ clientIp: string }>({
  // oxlint-disable-next-line no-empty-pattern -- Playwright requires a destructured first argument
  clientIp: async ({}, use) => use(randomIp()),
  page: async ({ page, clientIp }, use) => {
    await page.setExtraHTTPHeaders({ 'x-forwarded-for': clientIp });
    await use(page);
  },
});

export function newEmail(): string {
  return `${crypto.randomUUID()}@example.com`;
}

// Uses the separate `request` context, so the page itself stays logged out.
export async function registerViaApi(
  request: APIRequestContext,
  clientIp: string,
  email: string,
): Promise<void> {
  const response = await request.post('/api/v1/auth/register', {
    headers: { 'x-forwarded-for': clientIp },
    data: { email, name: 'Ada Lovelace', password: PASSWORD },
  });
  expect(response.status()).toBe(201);
}

export function formAlert(page: Page): Locator {
  return page.getByRole('main').getByRole('alert');
}

// `page.request` shares the page's cookie jar, so the page is signed in afterwards.
export async function signInViaApi(
  page: Page,
  clientIp: string,
  name = 'Ada Lovelace',
): Promise<string> {
  const email = newEmail();
  const response = await page.request.post('/api/v1/auth/register', {
    headers: { 'x-forwarded-for': clientIp },
    data: { email, name, password: PASSWORD },
  });
  expect(response.status()).toBe(201);
  return email;
}

export function navBar(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Main' });
}
