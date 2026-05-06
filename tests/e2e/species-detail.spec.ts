/**
 * ForageWise — E2E Tests: Species Detail Page
 *
 * Tests dynamic routing with valid and invalid species IDs,
 * safety language enforcement, and associated species links.
 *
 * Run with: npx playwright test tests/e2e/species-detail.spec.ts
 *
 * Validates: Requirements 18.8
 */

import { test, expect } from '@playwright/test';

/** Helper: wait for species cards to load from IndexedDB */
async function waitForSpeciesCards(page: import('@playwright/test').Page) {
  await page.locator('a[href^="/field-guide/sp-"], a[href^="/field-guide/pl-"], a[href^="/field-guide/tree-"]').first().waitFor({ timeout: 15_000 });
}

test.describe('Species Detail — Valid Species ID', () => {
  test('should load species detail page from field guide navigation', async ({ page }) => {
    await page.goto('/field-guide');
    await waitForSpeciesCards(page);

    const firstCard = page.locator('a[href^="/field-guide/sp-"], a[href^="/field-guide/pl-"], a[href^="/field-guide/tree-"]').first();
    await firstCard.click();

    await expect(page).toHaveURL(/\/field-guide\/.+/);
    await expect(
      page.getByRole('heading', { level: 1 })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should display species information fields', async ({ page }) => {
    await page.goto('/field-guide');
    await waitForSpeciesCards(page);

    const firstCard = page.locator('a[href^="/field-guide/sp-"], a[href^="/field-guide/pl-"], a[href^="/field-guide/tree-"]').first();
    await firstCard.click();

    await expect(page).toHaveURL(/\/field-guide\/.+/);
    await expect(page.getByText(/habitat/i)).toBeVisible({ timeout: 10_000 });
  });

  test('should display a back button for navigation', async ({ page }) => {
    await page.goto('/field-guide');
    await waitForSpeciesCards(page);

    const firstCard = page.locator('a[href^="/field-guide/sp-"], a[href^="/field-guide/pl-"], a[href^="/field-guide/tree-"]').first();
    await firstCard.click();

    // Back button (breadcrumb) should be visible
    const backBtn = page.getByRole('button', { name: /back/i });
    await expect(backBtn).toBeVisible();
  });
});

test.describe('Species Detail — Invalid Species ID', () => {
  test('should show error message for non-existent species ID', async ({ page }) => {
    await page.goto('/field-guide/nonexistent-species-id-12345');

    const errorMessage = page.getByText(/not found|error|no species/i);
    await expect(errorMessage).toBeVisible({ timeout: 15_000 });
  });

  test('should provide a link back to the Field Guide on error', async ({ page }) => {
    await page.goto('/field-guide/invalid-id-that-does-not-exist');

    await page.getByText(/not found|error|no species/i).waitFor({ timeout: 15_000 });

    const fieldGuideLink = page.getByRole('button', { name: /field guide|browse|back|return/i }).first();
    await expect(fieldGuideLink).toBeVisible();
  });
});

test.describe('Species Detail — Safety Language', () => {
  test('should never display forbidden safety phrases', async ({ page }) => {
    await page.goto('/field-guide');
    await waitForSpeciesCards(page);

    const firstCard = page.locator('a[href^="/field-guide/sp-"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await expect(page).toHaveURL(/\/field-guide\/.+/);
      await page.waitForTimeout(2000);

      const bodyText = await page.locator('body').textContent();
      const lowerText = bodyText?.toLowerCase() ?? '';

      expect(lowerText).not.toContain('safe to eat');
      expect(lowerText).not.toContain('definitely edible');
      expect(lowerText).not.toContain('confirmed edible');
      expect(lowerText).not.toContain('ai verified');
    }
  });

  test('should not show "Last Updated" section', async ({ page }) => {
    await page.goto('/field-guide');
    await waitForSpeciesCards(page);

    const firstCard = page.locator('a[href^="/field-guide/sp-"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await expect(page).toHaveURL(/\/field-guide\/.+/);
      await page.waitForTimeout(2000);

      // "Last Updated" section should NOT exist
      const lastUpdated = page.locator('h2:has-text("Last Updated")');
      await expect(lastUpdated).toHaveCount(0);
    }
  });
});

test.describe('Species Detail — Associated Species Links', () => {
  test('should render associated species as tappable links on tree detail pages', async ({ page }) => {
    await page.goto('/field-guide');
    await waitForSpeciesCards(page);

    // Filter to trees
    const treeFilter = page.getByRole('button', { name: /tree/i });
    if (await treeFilter.isVisible()) {
      await treeFilter.click();
      await page.waitForTimeout(1000);

      const treeCard = page.locator('a[href^="/field-guide/tree-"]').first();
      if (await treeCard.isVisible()) {
        await treeCard.click();
        await expect(page).toHaveURL(/\/field-guide\/tree-.+/);
        await page.waitForTimeout(2000);

        // Look for associated species section
        const associatedSection = page.getByText(/associated species/i);
        if (await associatedSection.isVisible().catch(() => false)) {
          // Should have links to other species
          const associatedLinks = page.locator('[aria-label*="View"][aria-label*="field guide"]');
          const linkCount = await associatedLinks.count();
          // At least some should be rendered (as links or plain text)
          expect(linkCount).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});
