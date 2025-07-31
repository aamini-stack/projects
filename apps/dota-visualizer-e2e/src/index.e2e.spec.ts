import { heroNames } from '@aamini/dota-visualizer/hero';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('Screenshot Armor Page', async ({ page }) => {
  const allIcons = await page.getByRole('table').getByRole('img').all();
  expect(allIcons).toHaveLength(heroNames.length);
  for (const icon of allIcons) {
    await expect(icon).not.toHaveJSProperty('naturalWidth', 0, {
      timeout: 50_000,
    });
  }

  await expect(page).toHaveScreenshot({
    fullPage: true,
  });
});
