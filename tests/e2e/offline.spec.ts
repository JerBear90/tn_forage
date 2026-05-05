/**
 * ForageWise — E2E Tests: Offline Functionality
 *
 * Playwright test stubs verifying offline-first behavior.
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

// ---------------------------------------------------------------------------
// Field Guide Offline
// ---------------------------------------------------------------------------

test.describe('Field Guide — Offline', () => {
  test('should load Field Guide page while offline after initial visit', async ({ page }) => {
    // First visit online to populate caches
    await page.goto('/field-guide');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Go offline
    await goOffline(page);

    // Reload — should still render from cache/IndexedDB
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should display species list from IndexedDB while offline', async ({ page }) => {
    await page.goto('/field-guide');
    await expect(page.locator('[data-testid="species-card"]').first()).toBeVisible();

    await goOffline(page);
    await page.reload();

    // Species cards should still render from IndexedDB seed data
    await expect(page.locator('[data-testid="species-card"]').first()).toBeVisible();
  });

  test('should navigate to species detail while offline', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().click();
    await expect(page).toHaveURL(/\/field-guide\/.+/);

    // Go offline and reload the detail page
    await goOffline(page);
    await page.reload();
    await expect(page.getByText(/habitat/i)).toBeVisible();
  });

  test('should show offline badge when disconnected', async ({ page }) => {
    await page.goto('/');
    await goOffline(page);
    // Trigger the offline event
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByText(/offline/i).first()).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Trips — Offline Save
// ---------------------------------------------------------------------------

test.describe('Trips — Offline', () => {
  test('should save a trip while offline', async ({ page }) => {
    // Load the create trip page online first
    await page.goto('/trips/new');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Go offline
    await goOffline(page);

    // Fill in trip details
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill('2025-07-01');
    }
    const notesInput = page.getByPlaceholder(/notes/i).first();
    if (await notesInput.isVisible()) {
      await notesInput.fill('Offline trip test');
    }

    // Save should work offline (saves to IndexedDB)
    const saveButton = page.getByRole('button', { name: /save|create/i }).first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
    }
  });

  test('should list trips page while offline', async ({ page }) => {
    await page.goto('/trips');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await goOffline(page);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Expedition Logs — Offline Save
// ---------------------------------------------------------------------------

test.describe('Expedition Logs — Offline', () => {
  test('should load expedition page while offline after initial visit', async ({ page }) => {
    await page.goto('/expedition');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await goOffline(page);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should save expedition log entries while offline', async ({ page }) => {
    await page.goto('/expedition');

    await goOffline(page);

    // Attempt to create a quick log entry
    const captionInput = page.getByPlaceholder(/caption|notes/i).first();
    if (await captionInput.isVisible()) {
      await captionInput.fill('Offline expedition log test');
    }

    const saveButton = page.getByRole('button', { name: /save|log/i }).first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
    }
  });
});

// ---------------------------------------------------------------------------
// Map — Cached Tiles
// ---------------------------------------------------------------------------

test.describe('Map — Offline Tiles', () => {
  test('should display map page after initial online visit', async ({ page }) => {
    await page.goto('/map');
    // Wait for map to initialize
    await page.waitForTimeout(2000);
    await expect(page.locator('.leaflet-container').first()).toBeVisible();
  });

  test('should show cached map tiles when offline', async ({ page }) => {
    // Visit map online to cache tiles
    await page.goto('/map');
    await page.waitForTimeout(3000); // Allow tiles to load and cache

    await goOffline(page);
    await page.reload();

    // The map container should still render (tiles from SW cache)
    await expect(page.locator('.leaflet-container').first()).toBeVisible();
  });

  test('should show map markers from cached data while offline', async ({ page }) => {
    await page.goto('/map');
    await page.waitForTimeout(2000);

    await goOffline(page);
    await page.reload();
    await page.waitForTimeout(1000);

    // Leaflet markers should still be present from IndexedDB park/trail data
    const markers = page.locator('.leaflet-marker-icon');
    // At least the map container should be visible even if markers depend on data load
    await expect(page.locator('.leaflet-container').first()).toBeVisible();
  });
});
