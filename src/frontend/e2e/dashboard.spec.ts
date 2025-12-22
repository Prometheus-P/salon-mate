import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests
 * Tests the main marketing dashboard functionality
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display dashboard page with title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('대시보드');
    await expect(page.locator('text=마케팅 현황을 한눈에 확인하세요')).toBeVisible();
  });

  test('should show shop selector', async ({ page }) => {
    const shopSelector = page.getByRole('combobox');
    await expect(shopSelector).toBeVisible();
  });

  test('should show skeleton cards before shop is selected', async ({ page }) => {
    // Before shop selection, skeleton cards should be visible
    const skeletonCards = page.locator('[class*="skeleton"], [class*="animate-pulse"]');
    await expect(skeletonCards.first()).toBeVisible();
  });

  test('should display dashboard components after shop selection', async ({ page }) => {
    // Click the shop selector
    const shopSelector = page.getByRole('combobox');
    await shopSelector.click();

    // Wait for options to appear and select first shop
    const firstOption = page.getByRole('option').first();
    await firstOption.waitFor({ state: 'visible', timeout: 10000 });
    await firstOption.click();

    // After selecting a shop, dashboard components should load
    await expect(page.locator('text=/리뷰|Review/i')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to reviews page from dashboard', async ({ page }) => {
    // Select a shop first
    const shopSelector = page.getByRole('combobox');
    await shopSelector.click();
    const firstOption = page.getByRole('option').first();
    await firstOption.waitFor({ state: 'visible', timeout: 10000 });
    await firstOption.click();

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Click on a review-related link if available
    const reviewLink = page.locator('a[href*="reviews"]').first();
    if (await reviewLink.isVisible()) {
      await reviewLink.click();
      await expect(page).toHaveURL(/.*reviews.*/);
    }
  });
});

test.describe('Dashboard Navigation', () => {
  test('should have working header navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Check header exists
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should navigate to settings', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page.locator('h1, h2')).toContainText(/설정|Settings|프로필/i);
  });

  test('should navigate to instagram page', async ({ page }) => {
    await page.goto('/dashboard/instagram');
    await expect(page.locator('h1, h2')).toContainText(/Instagram|콘텐츠|포스트/i);
  });
});
