import { test, expect } from '@playwright/test';

test('resume - iframe and download', async ({ page }) => {
  await page.goto('/resume');
  await expect(page.locator('h1')).toHaveText(/Resume/i);
  const iframe = page.frameLocator('iframe[title="Resume PDF"]');
  await expect(iframe.locator('body')).toBeTruthy();
  // ensure download button exists
  await expect(page.locator('a:has-text("Download PDF")')).toBeVisible();
});
