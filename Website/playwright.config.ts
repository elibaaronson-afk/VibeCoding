import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  projects: [
    { name: 'Desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 720 } } },
    { name: 'Mobile', use: { browserName: 'webkit', viewport: { width: 375, height: 667 }, isMobile: true } },
  ],
  use: { headless: true },
});
