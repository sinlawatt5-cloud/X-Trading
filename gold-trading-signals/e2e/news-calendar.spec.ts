import { test, expect } from '@playwright/test';

test.describe('News Calendar Page', () => {
  test('should load news page and display calendar', async ({ page }) => {
    // We can mock the API if needed to ensure data is returned
    // await page.route('**/api/news**', async (route) => {
    //   await route.fulfill({ json: [] });
    // });
    
    await page.goto('/news');
    
    // Check main title
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Check if some form of calendar or news list is rendered
    const newsContainer = page.locator('text=📅').or(page.locator('text=📰'));
    await expect(newsContainer.first()).toBeVisible();
  });

  test('should have filter tags (Impact, Currency)', async ({ page }) => {
    await page.goto('/news');
    
    // Check for filter options like "High Impact", "USD", etc.
    const filterTag = page.locator('button', { hasText: '📋' }).or(page.locator('button', { hasText: '🔴' })).first();
    await expect(filterTag).toBeVisible();
  });
});
