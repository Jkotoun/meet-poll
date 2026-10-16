import type { Page } from '@playwright/test';
import { expect, registerViaApi, test } from './fixtures';

// The browser's time zone becomes the event's, so pin it for stable text.
test.use({ timezoneId: 'Europe/Prague' });

async function fillSlot(
  page: Page,
  index: number,
  { date, start, end }: { date: string; start: string; end: string },
) {
  const slot = page.getByRole('group', { name: `Slot ${index + 1}` });
  await slot.getByLabel('Date').fill(date);
  await slot.getByLabel('Start').fill(start);
  await slot.getByLabel('End').fill(end);
}

test('creates an event and lists it under my events', async ({ page }) => {
  await registerViaApi(page.request);
  await page.goto('/events/new');

  await page.getByLabel('Title').fill('Team lunch');
  await fillSlot(page, 0, { date: '2026-11-03', start: '12:00', end: '13:00' });
  await page.getByRole('button', { name: 'Add slot' }).click();
  await fillSlot(page, 1, { date: '2026-11-02', start: '11:30', end: '12:30' });
  await page.getByRole('button', { name: 'Create event' }).click();

  await expect(page).toHaveURL(/\/events\/[\w-]{12}$/);
  const eventUrl = page.url();
  await expect(
    page.getByRole('heading', { name: 'Team lunch', level: 1 }),
  ).toBeVisible();
  await expect(page.getByText('Times in Europe/Prague')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Monday, 2 November 2026',
    'Tuesday, 3 November 2026',
  ]);
  await expect(page.getByText('11:30 – 12:30')).toBeVisible();

  await page.goto('/events');
  await page.getByRole('link', { name: 'Team lunch' }).click();
  await expect(page).toHaveURL(eventUrl);
});

test('checks slot times before calling the server', async ({ page }) => {
  await registerViaApi(page.request);
  await page.goto('/events/new');

  await page.getByLabel('Title').fill('Retro');
  await fillSlot(page, 0, { date: '2026-11-02', start: '10:00', end: '09:00' });
  await page.getByRole('button', { name: 'Create event' }).click();

  await expect(page.getByText('End must be after start')).toBeVisible();
  await expect(page).toHaveURL('/events/new');
});

test('sends a signed-out visitor of an event link to log in first', async ({
  page,
}) => {
  await page.goto('/events/abcdefghijkl');

  await expect(page).toHaveURL('/login?next=/events/abcdefghijkl');
});
