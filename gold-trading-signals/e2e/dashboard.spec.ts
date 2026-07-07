import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test('should load dashboard and show main sections', async ({ page }) => {
    await page.goto('/');
    
    // Check main title
    await expect(page.locator('h1').first()).toBeVisible();
    
    // The chart component should be visible
    const chart = page.locator('.tv-lightweight-charts').or(page.locator('canvas'));
    await expect(chart.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display active signals or signal cards', async ({ page }) => {
    await page.goto('/');
    
    // Look for signal cards or the signals list area
    const signalSection = page.locator('text=Signals').or(page.locator('text=Active Trade'));
    await expect(signalSection.first()).toBeVisible();
  });
});
