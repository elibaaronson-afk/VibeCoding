import { test, expect } from '@playwright/test';

test('home - loads and nav works', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.logo')).toBeVisible();
  await expect(page.locator('text=Eli Aaronson')).toBeVisible();
  // navigate to resume via header link
  await page.click('a.nav-link:has-text("Resume")');
  await expect(page).toHaveURL(/\/resume/);
  await expect(page.locator('iframe[title="Resume PDF"]')).toBeVisible();
});
