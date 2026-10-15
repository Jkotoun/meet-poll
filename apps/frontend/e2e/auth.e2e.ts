import {
  expect,
  formAlert,
  newEmail,
  PASSWORD,
  registerViaApi,
  test,
} from './fixtures';

test.describe('register', () => {
  test('creates an account, starts a session and returns to `next`', async ({
    page,
    context,
  }) => {
    await page.goto('/register?next=/?welcome');
    await page.getByLabel('Name').fill('Ada Lovelace');
    await page.getByLabel('Email').fill(newEmail());
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL('/?welcome');
    const cookies = await context.cookies();
    expect(cookies.find((cookie) => cookie.name === 'session')).toMatchObject({
      httpOnly: true,
      sameSite: 'Lax',
    });
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
    clientIp,
  }) => {
    const email = newEmail();
    await registerViaApi(request, clientIp, email);

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
  test('starts a session and returns to `next`', async ({
    page,
    context,
    request,
    clientIp,
  }) => {
    const email = newEmail();
    await registerViaApi(request, clientIp, email);

    await page.goto('/login?next=/?from=login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL('/?from=login');
    const cookies = await context.cookies();
    expect(cookies.some((cookie) => cookie.name === 'session')).toBe(true);
  });

  test('rejects a wrong password without saying which part was wrong', async ({
    page,
    request,
    clientIp,
  }) => {
    const email = newEmail();
    await registerViaApi(request, clientIp, email);

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('not the password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(formAlert(page)).toHaveText(
      'The email or password is incorrect',
    );
  });

  for (const next of [
    '//evil.example',
    '/%09/evil.example',
    '/.//evil.example',
  ]) {
    test(`never redirects off-site (next=${next})`, async ({
      page,
      request,
      clientIp,
    }) => {
      const email = newEmail();
      await registerViaApi(request, clientIp, email);

      await page.goto(`/login?next=${next}`);
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill(PASSWORD);
      await page.getByRole('button', { name: 'Log in' }).click();

      await expect(page).toHaveURL('/');
    });
  }
});
