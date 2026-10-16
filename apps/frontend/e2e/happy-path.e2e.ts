import type { Page } from '@playwright/test';
import { expect, newEmail, PASSWORD, test } from './fixtures';

const timezoneId = 'Europe/Prague';
test.use({ timezoneId });

async function registerViaForm(page: Page, name: string, next = '/') {
  await page.goto(`/register?next=${next}`);
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Email').fill(newEmail());
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(next);
}

function slotRow(page: Page, time: string) {
  return page
    .getByRole('listitem')
    .filter({ hasText: time })
    .filter({ has: page.getByRole('group') });
}

test('register, create, vote and finalize', async ({
  page,
  browser,
  baseURL,
}) => {
  await registerViaForm(page, 'Ada Lovelace');
  await page.goto('/events/new');
  await page.getByLabel('Title').fill('Team lunch');
  const first = page.getByRole('group', { name: 'Slot 1' });
  await first.getByLabel('Date').fill('2026-11-02');
  await first.getByLabel('Start').fill('12:00');
  await first.getByLabel('End').fill('13:00');
  await page.getByRole('button', { name: 'Add slot' }).click();
  const second = page.getByRole('group', { name: 'Slot 2' });
  await second.getByLabel('Start').fill('14:00');
  await second.getByLabel('End').fill('15:00');
  await page.getByRole('button', { name: 'Create event' }).click();
  await expect(page).toHaveURL(/\/events\/[\w-]{12}$/);
  const eventPath = new URL(page.url()).pathname;

  const guest = await browser.newContext({ baseURL, timezoneId });
  const guestPage = await guest.newPage();
  await registerViaForm(guestPage, 'Grace Hopper', eventPath);
  await slotRow(guestPage, '12:00 – 13:00')
    .getByRole('button', { name: 'If need be' })
    .click();
  await expect(slotRow(guestPage, '12:00 – 13:00')).toContainText(
    '1 if need be',
  );
  await slotRow(guestPage, '14:00 – 15:00')
    .getByRole('button', { name: 'Yes' })
    .click();
  await expect(slotRow(guestPage, '14:00 – 15:00')).toContainText('1 yes');

  await page.reload();
  await expect(slotRow(page, '14:00 – 15:00')).toContainText('Best');
  const ranked = page.getByRole('list', { name: 'Ranked slots' });
  await expect(ranked.getByRole('listitem').first()).toContainText(
    'Monday, 2 November 2026, 14:00 – 15:00',
  );
  page.once('dialog', (dialog) => void dialog.accept());
  await ranked.getByRole('button', { name: 'Pick' }).first().click();

  const banner = 'Final time: Monday, 2 November 2026, 14:00 – 15:00';
  await expect(page.getByText(banner)).toBeVisible();
  await expect(ranked).toBeHidden();

  await guestPage.reload();
  await expect(guestPage.getByText(banner)).toBeVisible();
  await expect(
    slotRow(guestPage, '12:00 – 13:00').getByRole('button', { name: 'Yes' }),
  ).toBeDisabled();
  await guest.close();
});
