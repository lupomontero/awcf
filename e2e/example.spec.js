import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:3000/examples/router-minimal/');

  // Expect an h1 "to contain" the text "Home Page".
  await expect(page.getByRole('heading', { name: 'Home Page' })).toBeVisible();

  // Click the "About" link and expect the heading to change to "About Page".
  await page.getByRole('link', { name: 'About' }).click();

  await new Promise((resolve) => {
    setTimeout(async () => {
      await expect(page.getByText('About Page')).toBeVisible();
      resolve();
    }, 100);
  });
});
