import { test, expect } from '@playwright/test';

test.describe('Parcours critique', () => {
  test('affiche la page de connexion', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('connexion puis accès au tableau de bord', async ({ page }) => {
    await page.goto('/');
    await page.locator('#email').fill('e2e-user');
    await page.locator('#password').fill('e2e-pass');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTitle('Se déconnecter')).toBeVisible({ timeout: 15_000 });
  });

  test('endpoint health.json', async ({ request }) => {
    const res = await request.get('/health.json');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.app).toBe('hublot');
  });
});
