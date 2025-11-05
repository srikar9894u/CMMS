import { test, expect } from '@playwright/test';

/**
 * CMMS Login E2E Tests
 * Tests the authentication flow
 */

test.describe('CMMS Login', () => {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/CMMS/);
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Fill in login form
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('**/dashboard', { timeout: 5000 });

    // Verify dashboard loaded with heading
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
    await expect(page.locator('text=Assets').first()).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill in login form with wrong credentials
    await page.fill('input[type="text"]', 'wronguser');
    await page.fill('input[type="password"]', 'wrongpass');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/Invalid|Error|Failed/i')).toBeVisible({ timeout: 3000 });
  });

  test('should not allow empty credentials', async ({ page }) => {
    // Click submit without filling form
    await page.click('button[type="submit"]');

    // Should still be on login page
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });
});
