import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Admin Dashboard.
 *
 * These tests verify that all dashboard sub-pages load without errors.
 * Note: Full functionality requires PocketBase running with a super_user account.
 * Without PocketBase, tests verify pages render without 404 errors.
 *
 * Run with: npx playwright test tests/e2e/admin-dashboard.spec.ts
 */

const DASHBOARD_PAGES = [
  { path: '/admin/dashboard', title: 'Analytics Dashboard' },
  { path: '/admin/dashboard/users', title: 'User Management' },
  { path: '/admin/dashboard/notifications', title: 'Push Notifications' },
  { path: '/admin/dashboard/content', title: 'Content Management' },
  { path: '/admin/dashboard/retention', title: 'Retention Metrics' },
  { path: '/admin/dashboard/funnels', title: 'Funnel Tracking' },
  { path: '/admin/dashboard/search', title: 'Search Analytics' },
  { path: '/admin/dashboard/onboarding', title: 'Onboarding Completion' },
  { path: '/admin/dashboard/revenue', title: 'Revenue' },
  { path: '/admin/dashboard/alerts', title: 'Anomaly Detection' },
  { path: '/admin/dashboard/releases', title: 'Release Notes' },
  { path: '/admin/dashboard/reviews', title: 'User Reviews' },
];

test.describe('Admin Dashboard', () => {
  test('admin dashboard page loads without 404', async ({ page }) => {
    const response = await page.goto('/admin/dashboard');
    expect(response?.status()).not.toBe(404);
  });

  test('admin sidebar or heading is visible', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForTimeout(3000);

    // Either the dashboard loads or we see an access gate
    const heading = page.locator('h1, h2').first();
    const accessGate = page.getByText(/admin|dashboard|access/i).first();

    const hasHeading = await heading.isVisible().catch(() => false);
    const hasGate = await accessGate.isVisible().catch(() => false);

    expect(hasHeading || hasGate).toBeTruthy();
  });

  for (const { path } of DASHBOARD_PAGES) {
    test(`${path} loads without 404`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).not.toBe(404);
    });
  }

  test('dashboard overview shows content when loaded', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForTimeout(3000);

    // Page should have some content (cards, headings, or access gate)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(50);
  });

  test('releases page renders', async ({ page }) => {
    await page.goto('/admin/dashboard/releases');
    await page.waitForTimeout(2000);

    // Should show release notes heading or access gate
    const content = page.getByText(/release|admin|access/i).first();
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('reviews page renders', async ({ page }) => {
    await page.goto('/admin/dashboard/reviews');
    await page.waitForTimeout(2000);

    const content = page.getByText(/review|admin|access/i).first();
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('no 404 errors on any dashboard route', async ({ page }) => {
    for (const { path } of DASHBOARD_PAGES) {
      const response = await page.goto(path);
      expect(response?.status()).not.toBe(404);
    }
  });
});
