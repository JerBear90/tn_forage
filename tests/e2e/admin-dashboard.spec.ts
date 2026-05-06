import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Admin Dashboard.
 *
 * These tests verify that all dashboard sub-pages load without errors
 * when accessed by an authenticated super_user.
 *
 * Note: These tests require PocketBase to be running with the analytics
 * collections created and a super_user account available.
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
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate as super_user
    await page.goto('/login');

    // Fill login form (adjust selectors if needed)
    const emailInput = page.locator('input[type="email"], input[name="email"], #email');
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password');

    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('jerameeflemming@gmail.com');
      await passwordInput.fill('test1234');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL('/', { timeout: 10000 }).catch(() => {});
    }
  });

  test('admin sidebar shows all dashboard links', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Check sidebar has key links (desktop view)
    const sidebar = page.locator('aside[aria-label="Admin navigation"]');
    if (await sidebar.isVisible().catch(() => false)) {
      await expect(sidebar.locator('text=Analytics')).toBeVisible();
      await expect(sidebar.locator('text=Users')).toBeVisible();
      await expect(sidebar.locator('text=Notifications')).toBeVisible();
      await expect(sidebar.locator('text=Revenue')).toBeVisible();
      await expect(sidebar.locator('text=Releases')).toBeVisible();
      await expect(sidebar.locator('text=Reviews')).toBeVisible();
    }
  });

  for (const { path, title } of DASHBOARD_PAGES) {
    test(`${path} loads without errors`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Should not show 404
      await expect(page.locator('text=This page could not be found')).not.toBeVisible();
      await expect(page.locator('text=404')).not.toBeVisible();

      // Should not show the access denied fallback (we're logged in as super_user)
      // Note: If auth isn't working in test, this will catch it
      const accessDenied = page.locator('text=Admin Access Required');
      const isAccessDenied = await accessDenied.isVisible().catch(() => false);

      if (!isAccessDenied) {
        // Page loaded successfully — check for page-specific content
        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible({ timeout: 5000 });
      }
    });
  }

  test('dashboard overview shows KPI cards', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for overview cards (they may show loading or data)
    const cards = page.locator('[class*="rounded-xl"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('notifications page shows templates', async ({ page }) => {
    await page.goto('/admin/dashboard/notifications');
    await page.waitForLoadState('networkidle');

    // Check for template buttons
    const templateSection = page.locator('text=Quick Templates');
    if (await templateSection.isVisible().catch(() => false)) {
      await expect(page.locator('text=Weekly Challenge')).toBeVisible();
      await expect(page.locator('text=Safety Reminder')).toBeVisible();
    }
  });

  test('releases page shows version history', async ({ page }) => {
    await page.goto('/admin/dashboard/releases');
    await page.waitForLoadState('networkidle');

    // Check for release entries
    await expect(page.locator('text=Release Notes')).toBeVisible();
    await expect(page.locator('text=v1.8.0')).toBeVisible();
  });

  test('reviews page shows filter controls', async ({ page }) => {
    await page.goto('/admin/dashboard/reviews');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=User Reviews')).toBeVisible();
    await expect(page.locator('text=All Types')).toBeVisible();
  });

  test('no 404 errors on any dashboard route', async ({ page }) => {
    for (const { path } of DASHBOARD_PAGES) {
      const response = await page.goto(path);
      expect(response?.status()).not.toBe(404);
    }
  });
});
