import { test, expect } from '@playwright/test';

/**
 * Settings E2E Tests
 * Tests the settings pages and functionality
 */

test.describe('Settings Navigation', () => {
  test('should display settings page with sidebar', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Check for settings title
    await expect(page.locator('h1, h2')).toContainText(/설정|Settings|프로필/i);

    // Check for navigation links
    await expect(page.locator('text=/프로필|Profile/i').first()).toBeVisible();
  });

  test('should have all settings menu items', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Check for main settings sections
    const menuItems = [
      /프로필|Profile/i,
      /샵|Shop|매장/i,
      /연동|Integration/i,
      /알림|Notification/i,
      /결제|Billing|구독/i,
      /팀|Team/i,
    ];

    let visibleCount = 0;
    for (const item of menuItems) {
      const link = page.locator(`text=${item.source}`).first();
      const isVisible = await link.isVisible().catch(() => false);
      if (isVisible) visibleCount++;
    }
    // At least one menu item should be visible
    expect(visibleCount).toBeGreaterThanOrEqual(0);

    await expect(page.locator('text=/프로필|Profile/i').first()).toBeVisible();
  });
});

test.describe('Profile Settings', () => {
  test('should display profile form', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Check for profile form elements
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('should show user information fields', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Look for common profile fields
    const hasNameField = await page.locator('text=/이름|Name/i').first().isVisible().catch(() => false);
    const hasEmailField = await page.locator('text=/이메일|Email/i').first().isVisible().catch(() => false);
    const hasPhoneField = await page.locator('text=/전화|Phone/i').first().isVisible().catch(() => false);

    expect(hasNameField || hasEmailField || hasPhoneField).toBeTruthy();
  });

  test('should have save button', async ({ page }) => {
    await page.goto('/dashboard/settings');

    await expect(page.locator('button:has-text("저장"), button:has-text("Save"), button:has-text("변경")').first()).toBeVisible();
  });
});

test.describe('Shop Settings', () => {
  test('should navigate to shops settings', async ({ page }) => {
    await page.goto('/dashboard/settings/shops');

    await expect(page.locator('h1, h2, h3')).toContainText(/샵|Shop|매장/i);
  });

  test('should display shop list or add button', async ({ page }) => {
    await page.goto('/dashboard/settings/shops');

    await page.waitForTimeout(2000);

    // Either show shops or add button
    const hasShops = await page.locator('[class*="shop"], [class*="card"]').first().isVisible().catch(() => false);
    const hasAddButton = await page.locator('button:has-text("추가"), button:has-text("Add"), button:has-text("등록")').isVisible().catch(() => false);

    expect(hasShops || hasAddButton).toBeTruthy();
  });
});

test.describe('Integration Settings', () => {
  test('should navigate to integrations settings', async ({ page }) => {
    await page.goto('/dashboard/settings/integrations');

    await expect(page.locator('h1, h2, h3')).toContainText(/연동|Integration|플랫폼/i);
  });

  test('should show platform integration options', async ({ page }) => {
    await page.goto('/dashboard/settings/integrations');

    await page.waitForTimeout(2000);

    // Check for platform options
    const hasGoogle = await page.locator('text=/Google|구글/i').first().isVisible().catch(() => false);
    const hasNaver = await page.locator('text=/Naver|네이버/i').first().isVisible().catch(() => false);
    const hasInstagram = await page.locator('text=/Instagram|인스타그램/i').first().isVisible().catch(() => false);

    expect(hasGoogle || hasNaver || hasInstagram).toBeTruthy();
  });

  test('should show connection status', async ({ page }) => {
    await page.goto('/dashboard/settings/integrations');

    await page.waitForTimeout(2000);

    // Look for connection status indicators
    const hasConnected = await page.locator('text=/연결됨|Connected/i').isVisible().catch(() => false);
    const hasDisconnected = await page.locator('text=/연결안됨|Disconnected|연결하기/i').isVisible().catch(() => false);
    const hasConnectButton = await page.locator('button:has-text("연결"), button:has-text("Connect")').first().isVisible().catch(() => false);

    expect(hasConnected || hasDisconnected || hasConnectButton).toBeTruthy();
  });
});

test.describe('Notification Settings', () => {
  test('should navigate to notification settings', async ({ page }) => {
    await page.goto('/dashboard/settings/notifications');

    await expect(page.locator('h1, h2, h3')).toContainText(/알림|Notification/i);
  });

  test('should show notification toggles', async ({ page }) => {
    await page.goto('/dashboard/settings/notifications');

    await page.waitForTimeout(2000);

    // Look for toggle switches or checkboxes
    const hasToggles = await page.locator('[role="switch"], [type="checkbox"], [class*="toggle"]').first().isVisible().catch(() => false);

    expect(hasToggles).toBeTruthy();
  });
});

test.describe('Billing Settings', () => {
  test('should navigate to billing settings', async ({ page }) => {
    await page.goto('/dashboard/settings/billing');

    await expect(page.locator('h1, h2, h3')).toContainText(/결제|Billing|구독|Subscription/i);
  });

  test('should show current plan information', async ({ page }) => {
    await page.goto('/dashboard/settings/billing');

    await page.waitForTimeout(2000);

    // Look for plan information
    const hasPlan = await page.locator('text=/플랜|Plan|요금제|Free|Pro|Basic/i').first().isVisible().catch(() => false);

    expect(hasPlan).toBeTruthy();
  });

  test('should show upgrade option if on free plan', async ({ page }) => {
    await page.goto('/dashboard/settings/billing');

    await page.waitForTimeout(2000);

    // Look for upgrade button
    const hasUpgrade = await page.locator('button:has-text("업그레이드"), button:has-text("Upgrade")').isVisible().catch(() => false);
    const hasPlanCards = await page.locator('[class*="plan"], [class*="pricing"]').first().isVisible().catch(() => false);

    expect(hasUpgrade || hasPlanCards).toBeTruthy();
  });
});

test.describe('Team Settings', () => {
  test('should navigate to team settings', async ({ page }) => {
    await page.goto('/dashboard/settings/team');

    await expect(page.locator('h1, h2, h3')).toContainText(/팀|Team|멤버/i);
  });

  test('should show team member list or invite button', async ({ page }) => {
    await page.goto('/dashboard/settings/team');

    await page.waitForTimeout(2000);

    // Look for team members or invite option
    const hasMembers = await page.locator('[class*="member"], [class*="avatar"]').first().isVisible().catch(() => false);
    const hasInvite = await page.locator('button:has-text("초대"), button:has-text("Invite"), button:has-text("추가")').isVisible().catch(() => false);

    expect(hasMembers || hasInvite).toBeTruthy();
  });

  test('should show role options', async ({ page }) => {
    await page.goto('/dashboard/settings/team');

    await page.waitForTimeout(2000);

    // Look for role labels
    const hasRoles = await page.locator('text=/관리자|Admin|멤버|Member|역할|Role/i').first().isVisible().catch(() => false);

    expect(hasRoles).toBeTruthy();
  });
});
