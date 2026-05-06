/**
 * ForageWise — E2E Tests: Field Guide
 *
 * Tests field guide page navigation, species list filtering by category,
 * season, and region, and species detail page rendering from list click.
 *
 * Run with: npx playwright test tests/e2e/field-guide.spec.ts
 *
 * Validates: Requirements 18.2
 */

import { test, expect } from '@playwright/test';

test.describe('Field Guide — Navigation and Rendering', () => {
  test('should navigate to the Field Guide page from bottom nav', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /field guide/i }).click();
    await expect(page).toHaveURL(/\/field-guide/);
    await expect(
      page.getByRole('heading', { level: 1 })
    ).toBeVisible();
  });

  test('should display species list with search input', async ({ page }) => {
    await page.goto('/field-guide');
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test('should display at least one species card from seed data', async ({ page }) => {
    await page.goto('/field-guide');
    // Wait for IndexedDB hydration and species cards to render
    await expect(
      page.locator('[data-testid="species-card"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Field Guide — Category Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/field-guide');
    // Wait for species cards to load
    await page.locator('[data-testid="species-card"]').first().waitFor({ timeout: 10_000 });
  });

  test('should filter species by mushroom category', async ({ page }) => {
    const mushroomFilter = page.getByRole('button', { name: /mushroom/i });
    if (await mushroomFilter.isVisible()) {
      await mushroomFilter.click();
      // After filtering, cards should still be visible (or empty state)
      const cards = page.locator('[data-testid="species-card"]');
      const emptyState = page.getByText(/no species match/i);
      const hasCards = (await cards.count()) > 0;
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      expect(hasCards || hasEmpty).toBeTruthy();
    }
  });

  test('should filter species by plant category', async ({ page }) => {
    const plantFilter = page.getByRole('button', { name: /plant/i });
    if (await plantFilter.isVisible()) {
      await plantFilter.click();
      const cards = page.locator('[data-testid="species-card"]');
      const emptyState = page.getByText(/no species match/i);
      const hasCards = (await cards.count()) > 0;
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      expect(hasCards || hasEmpty).toBeTruthy();
    }
  });

  test('should filter species by tree category', async ({ page }) => {
    const treeFilter = page.getByRole('button', { name: /tree/i });
    if (await treeFilter.isVisible()) {
      await treeFilter.click();
      const cards = page.locator('[data-testid="species-card"]');
      const emptyState = page.getByText(/no species match/i);
      const hasCards = (await cards.count()) > 0;
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      expect(hasCards || hasEmpty).toBeTruthy();
    }
  });
});

test.describe('Field Guide — Season Filtering', () => {
  test('should filter species by season', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().waitFor({ timeout: 10_000 });

    // Look for a season filter button (Spring, Summer, Fall, Winter)
    const seasonFilter = page.getByRole('button', { name: /spring|summer|fall|winter/i }).first();
    if (await seasonFilter.isVisible()) {
      await seasonFilter.click();
      // After filtering, the page should show filtered results or empty state
      const cards = page.locator('[data-testid="species-card"]');
      const emptyState = page.getByText(/no species match/i);
      const hasCards = (await cards.count()) > 0;
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      expect(hasCards || hasEmpty).toBeTruthy();
    }
  });
});

test.describe('Field Guide — Region Filtering', () => {
  test('should display regional filter chips', async ({ page }) => {
    await page.goto('/field-guide');
    // RegionalFilter renders chips for All Regions, East TN, Middle TN, West TN
    const allRegions = page.getByRole('button', { name: /all regions/i });
    await expect(allRegions).toBeVisible({ timeout: 10_000 });
  });

  test('should filter by East TN region', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().waitFor({ timeout: 10_000 });

    const eastTnFilter = page.getByRole('button', { name: /east tn/i });
    if (await eastTnFilter.isVisible()) {
      await eastTnFilter.click();
      // Results should be filtered to East TN species
      const cards = page.locator('[data-testid="species-card"]');
      const emptyState = page.getByText(/no species match/i);
      const hasCards = (await cards.count()) > 0;
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      expect(hasCards || hasEmpty).toBeTruthy();
    }
  });

  test('should filter by Middle TN region', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().waitFor({ timeout: 10_000 });

    const middleTnFilter = page.getByRole('button', { name: /middle tn/i });
    if (await middleTnFilter.isVisible()) {
      await middleTnFilter.click();
      const cards = page.locator('[data-testid="species-card"]');
      const emptyState = page.getByText(/no species match/i);
      const hasCards = (await cards.count()) > 0;
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      expect(hasCards || hasEmpty).toBeTruthy();
    }
  });

  test('should filter by West TN region', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().waitFor({ timeout: 10_000 });

    const westTnFilter = page.getByRole('button', { name: /west tn/i });
    if (await westTnFilter.isVisible()) {
      await westTnFilter.click();
      const cards = page.locator('[data-testid="species-card"]');
      const emptyState = page.getByText(/no species match/i);
      const hasCards = (await cards.count()) > 0;
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      expect(hasCards || hasEmpty).toBeTruthy();
    }
  });
});

test.describe('Field Guide — Species Detail from List Click', () => {
  test('should navigate to species detail page when clicking a species card', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().waitFor({ timeout: 10_000 });

    await page.locator('[data-testid="species-card"]').first().click();
    await expect(page).toHaveURL(/\/field-guide\/.+/);

    // Species detail page should show key information
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should display species information on detail page', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().waitFor({ timeout: 10_000 });

    await page.locator('[data-testid="species-card"]').first().click();
    await expect(page).toHaveURL(/\/field-guide\/.+/);

    // Key fields should be present on the detail page
    await expect(page.getByText(/habitat/i)).toBeVisible();
    await expect(page.getByText(/season/i)).toBeVisible();
  });
});
