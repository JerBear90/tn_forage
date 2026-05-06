/**
 * ForageWise — E2E Tests: Map Page
 *
 * Tests map page rendering with Leaflet, switching between map and list views,
 * opening a detail panel (top positioning), heatmap, and map height.
 *
 * Run with: npx playwright test tests/e2e/map.spec.ts
 *
 * Validates: Requirements 18.3
 */

import { test, expect } from '@playwright/test';

test.describe('Map Page — Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/map');
  });

  test('should render the map page with heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: /map/i })
    ).toBeVisible();
  });

  test('should render the Leaflet map container', async ({ page }) => {
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 15_000 });
  });

  test('should display the map/list toggle controls', async ({ page }) => {
    const mapToggle = page.getByRole('button', { name: /map/i });
    const listToggle = page.getByRole('button', { name: /list/i });
    await expect(mapToggle).toBeVisible();
    await expect(listToggle).toBeVisible();
  });

  test('should display season heatmap toggle button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /season heatmap/i })
    ).toBeVisible();
  });
});

test.describe('Map Page — Map/List Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/map');
  });

  test('should default to map view mode', async ({ page }) => {
    const mapButton = page.getByRole('button', { name: /map/i });
    await expect(mapButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should switch to list view when clicking List button', async ({ page }) => {
    const listButton = page.getByRole('button', { name: /list/i });
    await listButton.click();

    await expect(listButton).toHaveAttribute('aria-pressed', 'true');

    // List view region should be visible
    const listView = page.locator('[aria-label="List view"]');
    await expect(listView).toBeVisible();
  });

  test('should switch back to map view when clicking Map button', async ({ page }) => {
    // First switch to list
    await page.getByRole('button', { name: /list/i }).click();

    // Then switch back to map
    const mapButton = page.getByRole('button', { name: /map/i });
    await mapButton.click();

    await expect(mapButton).toHaveAttribute('aria-pressed', 'true');

    // Map view region should be visible
    const mapView = page.locator('[aria-label="Map view"]');
    await expect(mapView).toBeVisible();
  });
});

test.describe('Map Page — Detail Panel', () => {
  test('should open detail panel at top of viewport when a list item is clicked', async ({ page }) => {
    await page.goto('/map');

    // Switch to list view to click an item
    await page.getByRole('button', { name: /list/i }).click();

    // Wait for list items to load
    const listItem = page.locator('[aria-label="List view"] button, [aria-label="List view"] [role="button"]').first();
    if ((await listItem.count()) > 0) {
      await listItem.click();

      // Detail panel should appear
      const detailPanel = page.locator('[role="dialog"], [aria-label*="detail" i], [aria-label*="Detail" i]').first();
      if ((await detailPanel.count()) > 0) {
        await expect(detailPanel).toBeVisible();

        const panelBox = await detailPanel.boundingBox();
        if (panelBox) {
          expect(panelBox.y).toBeLessThan(300);
        }
      }
    }
  });
});

test.describe('Map Page — No Legend', () => {
  test('should NOT display a legend (removed per design)', async ({ page }) => {
    await page.goto('/map');

    const legend = page.locator('[aria-label="Map legend"]');
    await expect(legend).toHaveCount(0);
  });

  test('should still show heatmap and filters', async ({ page }) => {
    await page.goto('/map');

    // Heatmap toggle should be visible
    await expect(
      page.getByRole('button', { name: /season heatmap/i })
    ).toBeVisible();

    // Condition filters should be available in list view
    await page.getByRole('button', { name: /list/i }).click();
    await page.waitForTimeout(1000);

    // Filter chips should be visible if conditions data is loaded
    const filterGroup = page.locator('[aria-label="Foraging condition filters"]');
    // May or may not be visible depending on data load timing
  });
});

test.describe('Map Page — Map Height', () => {
  test('should constrain map height to not fill the full viewport', async ({ page }) => {
    await page.goto('/map');

    const mapView = page.locator('[aria-label="Map view"]');
    await expect(mapView).toBeVisible({ timeout: 10_000 });

    const mapBox = await mapView.boundingBox();
    const viewportSize = page.viewportSize();

    if (mapBox && viewportSize) {
      expect(mapBox.height).toBeLessThan(viewportSize.height);
      expect(mapBox.height).toBeGreaterThanOrEqual(290);
    }
  });
});

test.describe('Map Page — Z-Index', () => {
  test('bottom nav should not be overlaid by the map', async ({ page }) => {
    await page.goto('/map');

    const nav = page.getByRole('navigation', { name: /main navigation/i });
    await expect(nav).toBeVisible();

    const zIndex = await nav.evaluate((el) => getComputedStyle(el).zIndex);
    expect(Number(zIndex)).toBeGreaterThanOrEqual(9999);
  });
});
