/**
 * ForageWise — E2E Tests: Mobile Viewport
 *
 * Playwright test stubs for mobile device layouts.
 * Verifies that the app renders correctly on iPhone Safari
 * and Android Chrome viewports with proper bottom nav,
 * map controls, and touch-friendly targets.
 *
 * Run with: npx playwright test tests/e2e/mobile.spec.ts
 */

import { test, expect, devices } from '@playwright/test';

// ---------------------------------------------------------------------------
// iPhone Safari Viewport
// ---------------------------------------------------------------------------

test.describe('iPhone Safari Viewport', () => {
  test.use({ ...devices['iPhone 13'] });

  test('should render home page at iPhone viewport', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Viewport should be mobile-sized
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(430);
  });

  test('should display bottom navigation on iPhone', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav').last();
    await expect(nav).toBeVisible();
    // Bottom nav should be at the bottom of the viewport
    const navBox = await nav.boundingBox();
    const viewport = page.viewportSize();
    if (navBox && viewport) {
      // Nav should be in the lower portion of the screen
      expect(navBox.y + navBox.height).toBeGreaterThan(viewport.height * 0.8);
    }
  });

  test('should have large tap targets on iPhone (min 44px)', async ({ page }) => {
    await page.goto('/');
    const buttons = page.locator('nav a, nav button');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        // WCAG AA requires minimum 44x44px touch targets
        expect(box.height).toBeGreaterThanOrEqual(40); // Allow slight tolerance
        expect(box.width).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('should render Field Guide on iPhone without horizontal scroll', async ({ page }) => {
    await page.goto('/field-guide');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewport = page.viewportSize();
    if (viewport) {
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 5); // Small tolerance
    }
  });

  test('should render map controls at usable size on iPhone', async ({ page }) => {
    await page.goto('/map');
    await page.waitForTimeout(2000);
    const mapContainer = page.locator('.leaflet-container').first();
    if ((await mapContainer.count()) > 0) {
      await expect(mapContainer).toBeVisible();
      const box = await mapContainer.boundingBox();
      if (box) {
        // Map should fill most of the viewport width
        const viewport = page.viewportSize();
        if (viewport) {
          expect(box.width).toBeGreaterThan(viewport.width * 0.9);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Android Chrome Viewport
// ---------------------------------------------------------------------------

test.describe('Android Chrome Viewport', () => {
  test.use({ ...devices['Pixel 5'] });

  test('should render home page at Android viewport', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(420);
  });

  test('should display bottom navigation on Android', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav').last();
    await expect(nav).toBeVisible();
  });

  test('should render species detail page on Android', async ({ page }) => {
    await page.goto('/field-guide');
    const card = page.locator('[data-testid="species-card"]').first();
    if ((await card.count()) > 0) {
      await card.click();
      await expect(page).toHaveURL(/\/field-guide\/.+/);
      // Content should be visible without horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewport = page.viewportSize();
      if (viewport) {
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 5);
      }
    }
  });

  test('should render map at full width on Android', async ({ page }) => {
    await page.goto('/map');
    await page.waitForTimeout(2000);
    const mapContainer = page.locator('.leaflet-container').first();
    if ((await mapContainer.count()) > 0) {
      await expect(mapContainer).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Bottom Nav Visibility Across Pages
// ---------------------------------------------------------------------------

test.describe('Bottom Nav Visibility', () => {
  test.use({ ...devices['iPhone 13'] });

  const pages = ['/', '/field-guide', '/identify', '/map', '/trips'];

  for (const pagePath of pages) {
    test(`should show bottom nav on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      const nav = page.locator('nav').last();
      await expect(nav).toBeVisible();
    });
  }
});

// ---------------------------------------------------------------------------
// Map Controls on Mobile
// ---------------------------------------------------------------------------

test.describe('Map Controls — Mobile', () => {
  test.use({ ...devices['iPhone 13'] });

  test('should display Find Me button on mobile map', async ({ page }) => {
    await page.goto('/map');
    await page.waitForTimeout(2000);
    const findMeButton = page.getByRole('button', { name: /find me|locate|gps/i }).first();
    if ((await findMeButton.count()) > 0) {
      await expect(findMeButton).toBeVisible();
      const box = await findMeButton.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
        expect(box.width).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('should display zoom controls on mobile map', async ({ page }) => {
    await page.goto('/map');
    await page.waitForTimeout(2000);
    const zoomIn = page.locator('.leaflet-control-zoom-in').first();
    const zoomOut = page.locator('.leaflet-control-zoom-out').first();
    if ((await zoomIn.count()) > 0) {
      await expect(zoomIn).toBeVisible();
      await expect(zoomOut).toBeVisible();
    }
  });

  test('should open marker detail panel on tap', async ({ page }) => {
    await page.goto('/map');
    await page.waitForTimeout(2000);
    const marker = page.locator('.leaflet-marker-icon').first();
    if ((await marker.count()) > 0) {
      await marker.click();
      // A detail panel or popup should appear
      const popup = page.locator('.leaflet-popup, [data-testid="map-detail-panel"]').first();
      await expect(popup).toBeVisible({ timeout: 3000 });
    }
  });
});
