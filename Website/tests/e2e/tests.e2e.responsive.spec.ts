import { test, expect } from '@playwright/test';
import path from 'path';

const filePath = 'file:///' + path.join(process.cwd(), 'index.html').replace(/\\/g, '/');

test.describe('Responsive checks', () => {
  test('homepage is visible and header exists', async ({ page }) => {
    await page.goto(filePath);
    await expect(page.locator('header')).toBeVisible();
    await expect(page).toHaveTitle(/VibeCoding|Vibe|Portfolio|Eli/);
  });
});
