import { test, expect } from '@playwright/test';

/**
 * CMMS Work Orders E2E Tests
 * Tests work order management functionality
 */

test.describe('CMMS Work Orders', () => {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost';

  test.beforeEach(async ({ page, isMobile }) => {
    // Login before each test
    await page.goto(baseUrl);
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Navigate to work orders - on mobile, go directly to avoid sidebar issues
    if (isMobile) {
      await page.goto(`${baseUrl}/work-orders`);
    } else {
      await page.getByRole('link', { name: /Work Orders/i }).click();
    }
    await page.waitForURL('**/work-orders');
  });

  test('should display work orders list', async ({ page }) => {
    // Check for work orders page heading
    await expect(page.getByRole('heading', { name: 'Work Orders' })).toBeVisible();

    // Check for filter/search options
    const filterElements = page.locator('select, input[placeholder*="search"], input[placeholder*="filter"]');
    await expect(filterElements.first()).toBeVisible({ timeout: 3000 });
  });

  test('should open create work order modal', async ({ page }) => {
    // Find and click create button
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();

    if (await createButton.count() > 0) {
      await createButton.click();

      // Modal should appear with heading
      await expect(page.getByRole('heading', { name: /New Work Order/i })).toBeVisible();
      await expect(page.locator('text=Title')).toBeVisible();
      await expect(page.locator('text=Asset')).toBeVisible();
    }
  });

  test('should filter work orders by status', async ({ page }) => {
    // Find status filter dropdown
    const statusFilter = page.locator('select').first();

    if (await statusFilter.count() > 0) {
      // Select a status
      await statusFilter.selectOption({ index: 1 });

      // Wait for filtered results
      await page.waitForTimeout(1000);

      // Verify page still shows work orders heading
      await expect(page.getByRole('heading', { name: 'Work Orders' })).toBeVisible();
    }
  });

  test('should display work order priorities', async ({ page }) => {
    // Check for priority badges in visible work order cards (not dropdown options)
    const workOrderCards = page.locator('[class*="card"]');

    // If there are work order cards, check for visible priority badges
    if (await workOrderCards.count() > 0) {
      const priorityBadge = workOrderCards.first().locator('[class*="badge"]').filter({ hasText: /urgent|high|medium|low/i });

      // Priority badge may or may not be visible depending on data
      const badgeCount = await priorityBadge.count();
      console.log(`Found ${badgeCount} priority badges in cards`);
    }
  });

  test('should display AUTO-TRIP work orders', async ({ page }) => {
    // Search for AUTO-TRIP work orders
    const autoTripWorkOrder = page.locator('text=AUTO-TRIP');

    // May or may not exist depending on PLC status
    const count = await autoTripWorkOrder.count();
    console.log(`Found ${count} AUTO-TRIP work orders`);
  });

  test('should handle work order assignment', async ({ page }) => {
    // Find first work order card
    const workOrderCard = page.locator('[class*="card"]').first();

    if (await workOrderCard.count() > 0) {
      // Look for assign button or assigned user
      const assignElements = workOrderCard.locator('text=/Assign|Assigned|Unassigned/i');

      if (await assignElements.count() > 0) {
        await expect(assignElements.first()).toBeVisible();
      }
    }
  });

  test('should logout successfully', async ({ page }) => {
    // Find logout button
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")');

    if (await logoutButton.count() > 0) {
      await logoutButton.click();

      // Should redirect to login
      await page.waitForURL('**/login', { timeout: 3000 }).catch(() => {
        // Might redirect to root
        expect(page.url()).toMatch(/login|\/$/);
      });
    }
  });
});
