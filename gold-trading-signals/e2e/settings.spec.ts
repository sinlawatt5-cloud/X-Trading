import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test('should load settings page and display options', async ({ page }) => {
    await page.goto('/settings');
    
    // Check main title
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Check for some common setting fields (API keys, theme, etc.)
    const themeOption = page.locator('#theme');
    await expect(themeOption).toBeVisible();
  });

  test('should have a save button', async ({ page }) => {
    await page.goto('/settings');
    
    const saveButton = page.locator('button[type="submit"]');
    await expect(saveButton.first()).toBeVisible();
  });
});
