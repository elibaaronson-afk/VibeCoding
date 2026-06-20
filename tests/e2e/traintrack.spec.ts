import { test, expect } from '@playwright/test';

test('traintrack - loads full app page', async ({ page }) => {
  await page.goto('/traintrack');
  await expect(page.locator('h1')).toHaveText(/TrainTrack/i);
  // back link should exist
  await expect(page.locator('a:has-text("Back to site")')).toBeVisible();
  // ensure mount container is present
  await expect(page.locator('#traintrack-root')).toBeVisible();
});
