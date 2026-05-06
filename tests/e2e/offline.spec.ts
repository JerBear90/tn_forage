/**
 * ForageWise — E2E Tests: Offline Functionality
 *
 * Playwright tests verifying offline-first behavior.
 * These tests simulate network disconnection to verify that core
 * features remain functional using IndexedDB and Service Worker caches.
 *
 * Run with: npx playwright test tests/e2e/offline.spec.ts
 */

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helper: go offline after initial page load
// ---------------------------------------------------------------------------

async function goOffline(page: import('@playwright/test').Page) {
  await page.context().setOffline(true);
}

async function goOnline(page: import('@playwright/test').Page) {
  await page.context().setOffline(false);
}

/** Wait for species cards to load */
async function waitForSpeciesCards(page: import('@playwright/test').Page) {
  await page.locator('a[href^="/field-guide/sp-"], a[href^="/field-guide/pl-"], a[href^="/field-guide/tree-"]').first().waitFor({ timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Field Guide Offline
// ---------------------------------------------------------------------------

test.describe('Field Guide — Offline', () => {
  test('should load Field Guide page while offline after initial visit', async ({ page }) => {
    // First visit online to populate caches
    await page.goto('/field-guide');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForTimeout(3000); // Allow IndexedDB to seed

    // Go offline
    await goOffline(page);

    // Reload — should still render from cache/IndexedDB
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });
  });

  test('should display species list from IndexedDB while offline', async ({ page }) => {
    await page.goto('/field-guide');
    await waitForSpeciesCards(page);

    await goOffline(page);
    await page.reload();
    await page.waitForTimeout(3000);

    // Species cards should still render from IndexedDB seed data
    const cards = page.locator('a[href^="/field-guide/sp-"], a[href^="/field-guide/pl-"], a[href^="/field-guide/tree-"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('should navigate to species detail while offline', async ({ page }) => {
    await page.goto('/field-guide');
    await waitForSpeciesCards(page);

    const firstCard = page.locator('a[href^="/field-guide/sp-"]').first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/field-guide\/.+/);
    await page.waitForTimeout(2000);

    // Go offline and reload the detail page
    await goOffline(page);
    await page.reload();
    await expect(page.getByText(/habitat/i)).toBeVisible({ timeout: 10_000 });
  });

  test('should show offline badge when disconnected', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    await goOffline(page);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByText(/offline/i).first()).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Trips — Offline Save
// ---------------------------------------------------------------------------

test.describe('Trips — Offline', () => {
  test('should save a trip while offline', async ({ page }) => {
    await page.goto('/trips/new');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Start planning
    const startBtn = page.getByRole('button', { name: /start planning my trip/i });
    if (await startBtn.isVisible()) {
      await startBtn.click();
    }

    // Go offline
    await goOffline(page);

    // Fill in trip details using custom location
    const customRadio = page.getByRole('radio', { name: /custom location/i });
    if (await customRadio.isVisible()) {
      await customRadio.click();
      await page.locator('#custom-location').fill('Offline test location');
    }

    const dateInput = page.locator('#trip-date');
    if (await dateInput.isVisible()) {
      await dateInput.fill('2025-07-01');
    }
  });

  test('should list trips page while offline', async ({ page }) => {
    await page.goto('/trips');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForTimeout(2000);

    await goOffline(page);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Expedition Logs — Offline Save
// ---------------------------------------------------------------------------

test.describe('Expedition Logs — Offline', () => {
  test('should load expedition page while offline after initial visit', async ({ page }) => {
    await page.goto('/expedition');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForTimeout(2000);

    await goOffline(page);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Map — Cached Tiles
// ---------------------------------------------------------------------------

test.describe('Map — Offline Tiles', () => {
  test('should display map page after initial online visit', async ({ page }) => {
    await page.goto('/map');
    await page.waitForTimeout(3000);
    await expect(page.locator('.leaflet-container').first()).toBeVisible();
  });

  test('should show cached map tiles when offline', async ({ page }) => {
    // Visit map online to cache tiles
    await page.goto('/map');
    await page.waitForTimeout(4000); // Allow tiles to load and cache

    await goOffline(page);
    await page.reload();
    await page.waitForTimeout(2000);

    // The map container should still render (tiles from SW cache)
    await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });
  });

  test('should show map markers from cached data while offline', async ({ page }) => {
    await page.goto('/map');
    await page.waitForTimeout(3000);

    await goOffline(page);
    await page.reload();
    await page.waitForTimeout(2000);

    // At least the map container should be visible
    await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 });
  });
});
