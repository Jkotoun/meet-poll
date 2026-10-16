import {
  expect,
  formAlert,
  navBar,
  newEmail,
  PASSWORD,
  registerViaApi,
  test,
} from './fixtures';

test.describe('register', () => {
  test('creates an account, signs in and returns to `next`', async ({
    page,
  }) => {
    await page.goto('/register?next=/?welcome');
    await page.getByLabel('Name').fill('Ada Lovelace');
    await page.getByLabel('Email').fill(newEmail());
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL('/?welcome');
    await expect(
      navBar(page).getByRole('link', { name: 'Ada Lovelace' }),
    ).toBeVisible();
  });

  test('shows the server validation error under the field', async ({
    page,
  }) => {
    await page.goto('/register');
    await page.getByLabel('Name').fill('Ada Lovelace');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('email must be an email')).toBeVisible();
    await expect(page).toHaveURL('/register');
  });

  test('explains that an email is already registered', async ({
    page,
    request,
  }) => {
    const email = await registerViaApi(request);

    await page.goto('/register');
    await page.getByLabel('Name').fill('Someone Else');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(formAlert(page)).toHaveText(
      'An account with this email already exists',
    );
  });

  test('checks required fields before calling the server', async ({ page }) => {
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.startsWith('/api/')) {
        apiCalls.push(request.url());
      }
    });

    await page.goto('/register');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(
      page.getByText('Password must be at least 8 characters'),
    ).toBeVisible();
    expect(apiCalls).toEqual([]);
  });
});

test.describe('log in', () => {
  test('signs in and returns to `next`', async ({ page, request }) => {
    const email = await registerViaApi(request);

    await page.goto('/login?next=/?from=login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL('/?from=login');
    await expect(
      navBar(page).getByRole('link', { name: 'Ada Lovelace' }),
    ).toBeVisible();
  });

  test('rejects a wrong password without saying which part was wrong', async ({
    page,
    request,
  }) => {
    const email = await registerViaApi(request);

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('not the password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(formAlert(page)).toHaveText(
      'The email or password is incorrect',
    );
  });

  test('never redirects off-site', async ({ page, request }) => {
    const email = await registerViaApi(request);

    await page.goto('/login?next=//evil.example');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL('/');
  });
});
