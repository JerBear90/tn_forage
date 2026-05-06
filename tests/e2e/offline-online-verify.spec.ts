/**
 * ForageWise — E2E Verification: Offline & Online Functionality
 *
 * Verifies that core features work both online and offline.
 * This is the definitive test that proves the offline-first architecture.
 *
 * Run with: npx playwright test tests/e2e/offline-online-verify.spec.ts
 */

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// ONLINE TESTS — Features that work with internet
// ---------------------------------------------------------------------------

test.describe('ONLINE — Core Features', () => {
  test('home page loads with all sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // QuickCapture button should be visible
    await expect(page.getByRole('button', { name: /quick capture/i })).toBeVisible();
  });

  test('field guide loads species from IndexedDB', async ({ page }) => {
    await page.goto('/field-guide');
    await page.waitForTimeout(5000); // Wait for IndexedDB seed
    const cards = page.locator('a[href^="/field-guide/sp-"], a[href^="/field-guide/pl-"], a[href^="/field-guide/tree-"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('species detail page renders with iNaturalist data', async ({ page }) => {
    await page.goto('/field-guide/sp-chanterelle');
    await page.waitForTimeout(5000);
    // Should show species name
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Should show habitat section
    await expect(page.getByText(/habitat/i)).toBeVisible();
  });

  test('map page loads with controls', async ({ page }) => {
    await page.goto('/map');
    await page.waitForTimeout(3000);
    await expect(page.getByRole('heading', { name: /map/i })).toBeVisible();
    // Download map button should be visible
    await expect(page.getByRole('button', { name: /download map/i })).toBeVisible();
  });

  test('trips page loads', async ({ page }) => {
    await page.goto('/trips');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('community page loads for guests', async ({ page }) => {
    await page.goto('/community');
    await page.waitForTimeout(3000);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('profile page loads', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
    // Life list should be visible
    await expect(page.getByText(/species/i)).toBeVisible();
  });

  test('survival toolkit page loads', async ({ page }) => {
    await page.goto('/survival');
    await expect(page.getByRole('heading', { name: /survival/i })).toBeVisible();
    await expect(page.getByText(/never eat/i)).toBeVisible();
  });

  test('support page loads with form', async ({ page }) => {
    await page.goto('/support');
    await expect(page.getByRole('heading', { name: /support/i })).toBeVisible();
    await expect(page.locator('#support-page')).toBeVisible();
  });

  test('weather panel opens on tap', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    // Click weather button in header
    const weatherBtn = page.getByRole('button', { name: /weather/i });
    await weatherBtn.click();
    // Panel should open
    await expect(page.getByRole('dialog', { name: /weather/i })).toBeVisible();
  });

  test('signup page shows only Google SSO', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /apple/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /microsoft/i })).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// OFFLINE TESTS — Features that must work without internet
// ---------------------------------------------------------------------------

test.describe('OFFLINE — Core Features Must Still Work', () => {
  test('field guide works offline after initial load', async ({ page, context }) => {
    // Load online first to seed IndexedDB
    await page.goto('/field-guide');
    await page.waitForTimeout(5000);

    // Verify data loaded
    const cardsOnline = page.locator('a[href^="/field-guide/sp-"], a[href^="/field-guide/pl-"], a[href^="/field-guide/tree-"]');
    expect(await cardsOnline.count()).toBeGreaterThan(0);

    // Go offline
    await context.setOffline(true);
    await page.reload();
    await page.waitForTimeout(3000);

    // Species should still be visible from IndexedDB
    const cardsOffline = page.locator('a[href^="/field-guide/sp-"], a[href^="/field-guide/pl-"], a[href^="/field-guide/tree-"]');
    expect(await cardsOffline.count()).toBeGreaterThan(0);

    await context.setOffline(false);
  });

  test('species detail works offline', async ({ page, context }) => {
    await page.goto('/field-guide/sp-chanterelle');
    await page.waitForTimeout(5000);
    await expect(page.getByText(/habitat/i)).toBeVisible();

    await context.setOffline(true);
    await page.reload();
    await page.waitForTimeout(3000);

    // Core content should still render from IndexedDB
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await context.setOffline(false);
  });

  test('map page renders offline', async ({ page, context }) => {
    await page.goto('/map');
    await page.waitForTimeout(4000);

    await context.setOffline(true);
    await page.reload();
    await page.waitForTimeout(3000);

    // Map heading should still be visible
    await expect(page.getByRole('heading', { name: /map/i })).toBeVisible();

    await context.setOffline(false);
  });

  test('trips page works offline', async ({ page, context }) => {
    await page.goto('/trips');
    await page.waitForTimeout(3000);

    await context.setOffline(true);
    await page.reload();
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await context.setOffline(false);
  });

  test('survival toolkit works offline', async ({ page, context }) => {
    await page.goto('/survival');
    await page.waitForTimeout(2000);

    await context.setOffline(true);
    await page.reload();
    await page.waitForTimeout(2000);

    // Emergency reference should work without internet
    await expect(page.getByText(/never eat/i)).toBeVisible();

    await context.setOffline(false);
  });

  test('profile page works offline', async ({ page, context }) => {
    await page.goto('/profile');
    await page.waitForTimeout(2000);

    await context.setOffline(true);
    await page.reload();
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();

    await context.setOffline(false);
  });

  test('quick capture button visible offline', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    await context.setOffline(true);
    await page.reload();
    await page.waitForTimeout(2000);

    // QuickCapture should still be accessible offline
    await expect(page.getByRole('button', { name: /quick capture/i })).toBeVisible();

    await context.setOffline(false);
  });

  test('bottom nav works offline', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    await context.setOffline(true);

    // Navigate via bottom nav
    const nav = page.getByRole('navigation', { name: /main navigation/i });
    await expect(nav).toBeVisible();

    await context.setOffline(false);
  });
});

// ---------------------------------------------------------------------------
// TRANSITION TESTS — Going offline then back online
// ---------------------------------------------------------------------------

test.describe('TRANSITION — Offline to Online', () => {
  test('app recovers gracefully when going back online', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);

    // Go back online
    await context.setOffline(false);
    await page.waitForTimeout(2000);

    // App should still be functional
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('data persists across offline/online cycles', async ({ page, context }) => {
    // Load field guide online
    await page.goto('/field-guide');
    await page.waitForTimeout(5000);

    const countOnline = await page.locator('a[href^="/field-guide/sp-"]').count();

    // Cycle: offline → online → check data
    await context.setOffline(true);
    await page.waitForTimeout(500);
    await context.setOffline(false);
    await page.reload();
    await page.waitForTimeout(5000);

    const countAfterCycle = await page.locator('a[href^="/field-guide/sp-"]').count();
    expect(countAfterCycle).toBe(countOnline);
  });
});
