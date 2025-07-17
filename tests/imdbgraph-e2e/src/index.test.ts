import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('Screenshot Homepage', async ({ page }) => {
  await page.getByRole('combobox').blur();
  await expect(page).toHaveScreenshot();
});

test('Screenshot Searchbar', async ({ page }) => {
  const searchBar = page.getByRole('combobox', { name: 'Search for TV shows' });
  await searchBar.click();
  await searchBar.fill('Avatar');
  const dropdown = page.getByRole('listbox');
  await expect(dropdown).toBeInViewport();
  await expect(page).toHaveScreenshot();
});

test('Title works', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: /Welcome to IMDB Graph/i }),
  ).toBeVisible();
});

test('Search bar click navigation works', async ({ page }) => {
  const searchBar = page.getByRole('combobox');
  await searchBar.click();
  await searchBar.fill('Avatar');
  const avatarDropdownOption = page.getByText(
    'Avatar: The Last Airbender 2005 - 2008',
  );
  await expect(avatarDropdownOption).toBeVisible();
  await avatarDropdownOption.click();
  await expect(page).toHaveURL(/.*\/ratings\?id=tt0417299/);
});

test('Search bar keyboard navigation works', async ({ page }) => {
  const searchBar = page.getByRole('combobox');
  await searchBar.click();
  await searchBar.fill('Avatar');
  await expect(
    page.getByText('Avatar: The Last Airbender 2005 - 2008'),
  ).toBeVisible();
  await searchBar.press('ArrowDown');
  await searchBar.press('Enter');
  await expect(page).toHaveURL(/.*\/ratings\?id=tt0417299/);
});

test('LinkedIn button works', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Aria' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/aria-amini/',
  );
});
