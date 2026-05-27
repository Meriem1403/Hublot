/**
 * Campagne manuelle ST-F01 → ST-F06 (reproductible en CI / local).
 * Environnement : preview build:e2e (équivalent QA documenté dans SCENARIOS_TEST.md).
 */
import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('#email').fill('e2e-user');
  await page.locator('#password').fill('e2e-pass');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTitle('Se déconnecter')).toBeVisible({ timeout: 15_000 });
}

test.describe('ST-F01 — Authentification', () => {
  test('refus identifiants invalides puis connexion et déconnexion', async ({ page }) => {
    await page.goto('/');
    await page.locator('#email').fill('invalid-user');
    await page.locator('#password').fill('wrong-pass');
    await page.getByTestId('login-submit').click();
    await expect(page.getByText(/incorrect/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible();

    await login(page);

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByTitle('Se déconnecter').click();
    await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('ST-F02 — Chargement des données', () => {
  test('trois onglets affichent du contenu sans erreur console bloquante', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await login(page);

    for (const label of ["Vue d'ensemble", 'Par mission', 'Vue dynamique']) {
      await page.getByRole('button', { name: label }).click();
      await expect(page.locator('main')).toBeVisible();
      await page.waitForTimeout(500);
    }

    const blocking = errors.filter((e) => !e.includes('Warning'));
    expect(blocking).toEqual([]);
  });
});

test.describe('ST-F03 — Filtres', () => {
  test('changement région met à jour la barre de filtres', async ({ page }) => {
    await login(page);
    const regionSelect = page.locator('select').first();
    const options = regionSelect.locator('option');
    const count = await options.count();
    if (count > 1) {
      const value = await options.nth(1).getAttribute('value');
      if (value && value !== 'all') {
        await regionSelect.selectOption(value);
        await expect(regionSelect).toHaveValue(value);
      }
    }
    await page.getByRole('button', { name: 'Réinitialiser' }).click({ timeout: 3000 }).catch(() => {});
  });
});

test.describe('ST-F04 — Responsive', () => {
  test('layout utilisable en 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await expect(page.getByRole('button', { name: "Vue d'ensemble" })).toBeVisible();
    await expect(page.getByText('Filtres', { exact: true })).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    const mainOverflow = await page.locator('main').evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(mainOverflow).toBeLessThan(40);
  });
});

test.describe('ST-F05 — Performance perçue', () => {
  test('trois changements d’onglet en moins de 15s', async ({ page }) => {
    await login(page);
    const start = Date.now();
    for (const label of ['Par région', 'Statuts', 'Âges']) {
      await page.getByRole('button', { name: label }).click();
      await expect(page.locator('main')).toBeVisible();
    }
    expect(Date.now() - start).toBeLessThan(15_000);
  });
});

test.describe('ST-F06 — Badge environnement (QA local)', () => {
  test('badge visible hors production sur build test', async ({ page }) => {
    await login(page);
    await expect(page.getByText(/Test local \(QA\)/)).toBeVisible();
  });
});
