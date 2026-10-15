import {
  expect,
  navBar,
  newEmail,
  PASSWORD,
  registerViaApi,
  signInViaApi,
  test,
} from './fixtures';

const ACCOUNT_LOGIN_URL = '/login?next=%2Faccount';

test('shows log in and create account links when signed out', async ({
  page,
}) => {
  await page.goto('/');

  await expect(
    navBar(page).getByRole('link', { name: 'Log in' }),
  ).toBeVisible();
  await expect(
    navBar(page).getByRole('link', { name: 'Create account' }),
  ).toBeVisible();
});

test('renders the signed-in nav on the server', async ({ page, clientIp }) => {
  await signInViaApi(page, clientIp, 'Grace Hopper');
  await page.route('**/api/v1/auth/me', (route) => route.abort());

  await page.goto('/');

  await expect(
    navBar(page).getByRole('link', { name: 'Grace Hopper' }),
  ).toBeVisible();
});

test('sends a signed-out visitor from /account to log in and back', async ({
  page,
  request,
  clientIp,
}) => {
  const email = newEmail();
  await registerViaApi(request, clientIp, email);

  await page.goto('/account');
  await expect(page).toHaveURL(ACCOUNT_LOGIN_URL);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL('/account');
  await expect(page.getByRole('main').getByText(email)).toBeVisible();
});

test('logs out to the landing page and locks /account again', async ({
  page,
  clientIp,
}) => {
  await signInViaApi(page, clientIp, 'Grace Hopper');
  await page.goto('/account');

  await navBar(page).getByRole('button', { name: 'Log out' }).click();

  await expect(page).toHaveURL('/');
  await expect(
    navBar(page).getByRole('link', { name: 'Log in' }),
  ).toBeVisible();
  await page.goto('/account');
  await expect(page).toHaveURL(ACCOUNT_LOGIN_URL);
});

test('treats a forged session cookie as signed out', async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([
    { name: 'session', value: 'forged', url: baseURL },
  ]);

  await page.goto('/account');

  await expect(page).toHaveURL(ACCOUNT_LOGIN_URL);
  await expect(
    navBar(page).getByRole('link', { name: 'Log in' }),
  ).toBeVisible();
});
