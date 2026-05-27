/**
 * Vérifications PROD documentées (ST-SEC01, ST-F06 partie production).
 * Ne nécessite pas d’identifiants métier.
 */
import { test, expect } from '@playwright/test';

const PROD_URL = 'https://dirmhublot.netlify.app';

test.describe('Production — lecture seule', () => {
  test('ST-SEC01 — health.json accessible', async ({ request }) => {
    const res = await request.get(`${PROD_URL}/health.json`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('ST-F06 — pas de badge environnement sur la page de connexion', async ({ page }) => {
    await page.goto(PROD_URL);
    await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible();
    await expect(page.getByRole('status', { name: /Développement|Test local|Préproduction|Aperçu/i })).toHaveCount(0);
  });

  test('ST-F01 — page login sans session', async ({ page }) => {
    await page.goto(PROD_URL);
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.getByTitle('Se déconnecter')).toHaveCount(0);
  });
});
