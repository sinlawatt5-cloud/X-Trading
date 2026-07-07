import { test, expect } from '@playwright/test';

test.describe('Analytics Page', () => {
  test('should load analytics page and display stat cards', async ({ page }) => {
    await page.goto('/analytics');
    
    // Check main title
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Check for some common stat cards (e.g. Profit Factor, Total Return, etc)
    const statCards = page.locator('.rounded-xl').or(page.locator('.clay-card'));
    await expect(statCards.first()).toBeVisible();
  });

  test('should render charts', async ({ page }) => {
    await page.goto('/analytics');
    
    // Check if the chart container is present
    const chartContainer = page.locator('text=📅').or(page.locator('text=🎯'));
    await expect(chartContainer.first()).toBeVisible({ timeout: 10000 });
  });
});
