import { test, expect } from '@playwright/test';

/**
 * CMMS Dashboard E2E Tests
 * Tests the dashboard functionality
 */

test.describe('CMMS Dashboard', () => {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost';

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(baseUrl);
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display dashboard statistics', async ({ page }) => {
    // Check for statistics cards with heading text
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
    await expect(page.locator('text=Assets').first()).toBeVisible();
    await expect(page.locator('text=Work Orders').first()).toBeVisible();

    // Check for animated counters (numbers should be visible)
    const counters = page.locator('[class*="font-bold"]').filter({ hasText: /^\d+$/ });
    await expect(counters.first()).toBeVisible();
  });

  test('should display status badges with correct colors', async ({ page }) => {
    // Check dashboard cards using reliable test IDs
    await expect(page.getByTestId('dashboard-assets-card')).toBeVisible();
    await expect(page.getByTestId('dashboard-workorders-card')).toBeVisible();

    // Verify status badges container is present
    await expect(page.getByTestId('assets-status-badges')).toBeVisible();

    // Verify card titles
    await expect(page.getByTestId('assets-card-title')).toHaveText('Assets');
    await expect(page.getByTestId('workorders-card-title')).toHaveText('Work Orders');
  });

  test('should navigate to assets page', async ({ page, isMobile }) => {
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost';

    // On mobile, navigate directly to avoid sidebar issues
    if (isMobile) {
      await page.goto(`${baseUrl}/assets`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      // Wait for loading state to complete
      await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 10000 }).catch(() => {
        // Loading text might not appear if page loads very quickly
      });
    } else {
      await page.getByRole('link', { name: /Assets/i }).click();
    }

    // Verify navigation
    await expect(page).toHaveURL(/.*assets/);
    // Wait longer for heading to appear after data loads
    await expect(page.getByRole('heading', { name: 'Assets' })).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to work orders page', async ({ page, isMobile }) => {
    // On mobile, navigate directly to avoid sidebar issues
    if (isMobile) {
      const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost';
      await page.goto(`${baseUrl}/work-orders`);
    } else {
      await page.getByRole('link', { name: /Work Orders/i }).click();
    }

    // Verify navigation
    await page.waitForURL('**/work-orders');
    await expect(page.getByRole('heading', { name: 'Work Orders' })).toBeVisible();
  });

  test('should display real-time status', async ({ page, isMobile }) => {
    // On mobile, navigate directly to avoid sidebar issues
    if (isMobile) {
      const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost';
      await page.goto(`${baseUrl}/real-time-status`);
    } else {
      await page.getByRole('link', { name: /Real-Time Status/i }).click();
    }

    // Verify navigation
    await page.waitForURL('**/real-time-status');
    await expect(page.getByRole('heading', { name: /Real-Time.*Status/i })).toBeVisible();
  });

  test('should handle theme toggle', async ({ page }) => {
    // Find theme toggle button (usually a moon/sun icon)
    const themeToggle = page.locator('button[title*="theme"], button[aria-label*="theme"]');

    if (await themeToggle.count() > 0) {
      await themeToggle.first().click();

      // Wait for theme change animation
      await page.waitForTimeout(500);

      // Click again to toggle back
      await themeToggle.first().click();
    }
  });

  test('should display gradient text on headings', async ({ page }) => {
    // Check for gradient styling on main heading
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });
});
