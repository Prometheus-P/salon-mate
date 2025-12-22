import { test, expect } from '@playwright/test';

/**
 * Onboarding E2E Tests
 * Tests the complete onboarding flow for new users
 */

test.describe('Onboarding Flow', () => {
  test('should display welcome page', async ({ page }) => {
    await page.goto('/onboarding/welcome');

    await expect(page.locator('h1')).toContainText('SalonMate에 오신 것을 환영합니다');
    await expect(page.locator('text=시작하기')).toBeVisible();
    await expect(page.locator('text=건너뛰기')).toBeVisible();
  });

  test('should show feature cards on welcome page', async ({ page }) => {
    await page.goto('/onboarding/welcome');

    // Check for feature descriptions
    await expect(page.locator('text=리뷰 자동 관리')).toBeVisible();
    await expect(page.locator('text=콘텐츠 예약 발행')).toBeVisible();
    await expect(page.locator('text=성과 분석')).toBeVisible();
    await expect(page.locator('text=AI 콘텐츠 생성')).toBeVisible();
  });

  test('should navigate from welcome to profile page', async ({ page }) => {
    await page.goto('/onboarding/welcome');

    await page.click('text=시작하기');
    await expect(page).toHaveURL(/.*onboarding\/profile.*/);
  });

  test('should display profile page with form fields', async ({ page }) => {
    await page.goto('/onboarding/profile');

    await expect(page.locator('h1')).toContainText('프로필 설정');
    await expect(page.locator('input[type="text"], input[placeholder*="이름"]')).toBeVisible();
  });

  test('should navigate from profile to shop page', async ({ page }) => {
    await page.goto('/onboarding/profile');

    // Fill in required fields
    const nameInput = page.locator('input').first();
    await nameInput.fill('테스트 사용자');

    // Click next button
    await page.click('text=다음');
    await expect(page).toHaveURL(/.*onboarding\/shop.*/);
  });

  test('should display shop registration page', async ({ page }) => {
    await page.goto('/onboarding/shop');

    await expect(page.locator('h1')).toContainText('매장 등록');
    await expect(page.locator('text=업종 선택')).toBeVisible();
    await expect(page.locator('text=헤어샵')).toBeVisible();
    await expect(page.locator('text=네일샵')).toBeVisible();
  });

  test('should allow business type selection', async ({ page }) => {
    await page.goto('/onboarding/shop');

    // Click on a business type
    await page.click('text=헤어샵');

    // The button should have selected state (primary color)
    const selectedButton = page.locator('button:has-text("헤어샵")');
    await expect(selectedButton).toHaveClass(/border-primary|bg-primary/);
  });

  test('should navigate from shop to integrations page', async ({ page }) => {
    await page.goto('/onboarding/shop');

    // Fill shop name
    const shopNameInput = page.locator('input[placeholder*="매장 이름"]');
    await shopNameInput.fill('테스트 샵');

    // Click next
    await page.click('text=다음');
    await expect(page).toHaveURL(/.*onboarding\/integrations.*/);
  });

  test('should display integrations page with platform options', async ({ page }) => {
    await page.goto('/onboarding/integrations');

    await expect(page.locator('h1')).toContainText('플랫폼 연동');
    await expect(page.locator('text=Google 비즈니스')).toBeVisible();
    await expect(page.locator('text=네이버 플레이스')).toBeVisible();
    await expect(page.locator('text=Instagram')).toBeVisible();
  });

  test('should allow skipping integrations', async ({ page }) => {
    await page.goto('/onboarding/integrations');

    await page.click('text=건너뛰기');
    await expect(page).toHaveURL(/.*onboarding\/complete.*/);
  });

  test('should display completion page', async ({ page }) => {
    await page.goto('/onboarding/complete');

    await expect(page.locator('h1')).toContainText('설정이 완료되었습니다');
    await expect(page.locator('text=다음 단계')).toBeVisible();
    await expect(page.locator('text=대시보드로 이동')).toBeVisible();
  });

  test('should navigate to dashboard from completion page', async ({ page }) => {
    await page.goto('/onboarding/complete');

    await page.click('text=대시보드로 이동');
    await expect(page).toHaveURL(/.*dashboard.*/);
  });
});

test.describe('Onboarding Progress', () => {
  test('should show progress indicator', async ({ page }) => {
    await page.goto('/onboarding/profile');

    // Progress bar should be visible
    const progressBar = page.locator('[role="progressbar"], [class*="progress"]');
    await expect(progressBar.first()).toBeVisible();
  });

  test('should update progress as user advances', async ({ page }) => {
    await page.goto('/onboarding/welcome');

    // Navigate through steps and check progress updates
    await page.click('text=시작하기');
    await expect(page).toHaveURL(/.*profile.*/);

    // Progress should have increased
    const progressBar = page.locator('[role="progressbar"], [class*="progress"]');
    await expect(progressBar.first()).toBeVisible();
  });
});
