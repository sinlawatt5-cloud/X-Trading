import { test, expect } from '@playwright/test';

test.describe('Journal Page', () => {
  test('should load journal page and display basic elements', async ({ page }) => {
    await page.goto('/journal');
    
    // Check main title or some key element
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Check for the "New Entry" button which is always visible
    await expect(page.locator('#new-journal-entry-btn')).toBeVisible();
  });

  test('should open new entry modal', async ({ page }) => {
    await page.goto('/journal');
    
    // Click on New Entry button
    const newEntryButton = page.locator('#new-journal-entry-btn');
    await newEntryButton.click();
    
    // Wait for modal to appear
    const modalTitle = page.locator('#journal-modal');
    await expect(modalTitle).toBeVisible();
  });
  
  test('should have filter options', async ({ page }) => {
    await page.goto('/journal');
    
    // Check for some filter button or dropdown
    const filterBtn = page.locator('#filter-all-btn');
    await expect(filterBtn).toBeVisible();
  });
});
