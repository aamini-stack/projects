import { heroNames } from '@aamini/dota-visualizer/hero';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('Screenshot Armor Page', async ({ page }) => {
  const table = page.getByRole('table');
  await expect(table.getByRole('img')).toHaveCount(heroNames.length);
  await expect(page).toHaveScreenshot({
    fullPage: true,
  });
});
