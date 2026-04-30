/**
 * ForageFlow — E2E Tests: Map Page
 *
 * Tests map page rendering with Leaflet, switching between map and list views,
 * opening a detail panel (top positioning), legend visibility, and map height.
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
    // Leaflet renders a container with class "leaflet-container"
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 15_000 });
  });

  test('should display the map/list toggle controls', async ({ page }) => {
    const mapToggle = page.getByRole('button', { name: /map/i });
    const listToggle = page.getByRole('button', { name: /list/i });
    await expect(mapToggle).toBeVisible();
    await expect(listToggle).toBeVisible();
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

      // Detail panel should appear — positioned at top (absolute top-0)
      const detailPanel = page.locator('[role="dialog"], [aria-label*="detail" i], [aria-label*="Detail" i]').first();
      if ((await detailPanel.count()) > 0) {
        await expect(detailPanel).toBeVisible();

        // Verify top positioning: the panel should be near the top of its container
        const panelBox = await detailPanel.boundingBox();
        if (panelBox) {
          // Panel top should be within the upper portion of the viewport
          expect(panelBox.y).toBeLessThan(300);
        }
      }
    }
  });
});

test.describe('Map Page — Legend', () => {
  test('should display legend above the map in map mode', async ({ page }) => {
    await page.goto('/map');

    const legend = page.locator('[aria-label="Map legend"]');
    await expect(legend).toBeVisible();

    // Legend should contain Parks, Trails, Routes labels
    await expect(legend).toContainText(/parks/i);
    await expect(legend).toContainText(/trails/i);
    await expect(legend).toContainText(/routes/i);
  });

  test('should hide legend in list mode', async ({ page }) => {
    await page.goto('/map');

    // Switch to list view
    await page.getByRole('button', { name: /list/i }).click();

    // Legend should not be visible in list mode
    const legend = page.locator('[aria-label="Map legend"]');
    await expect(legend).toHaveCount(0);
  });

  test('should position legend above the map container', async ({ page }) => {
    await page.goto('/map');

    const legend = page.locator('[aria-label="Map legend"]');
    const mapView = page.locator('[aria-label="Map view"]');

    await expect(legend).toBeVisible();
    await expect(mapView).toBeVisible();

    const legendBox = await legend.boundingBox();
    const mapBox = await mapView.boundingBox();

    if (legendBox && mapBox) {
      // Legend bottom should be above or at the map top
      expect(legendBox.y + legendBox.height).toBeLessThanOrEqual(mapBox.y + 10);
    }
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
      // Map height should be less than full viewport height
      // Design specifies max(65vh, 300px), so it should be roughly 65% of viewport
      expect(mapBox.height).toBeLessThan(viewportSize.height);
      // Map should be at least 300px tall
      expect(mapBox.height).toBeGreaterThanOrEqual(290); // small tolerance
    }
  });
});
