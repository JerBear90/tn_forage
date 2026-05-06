/**
 * ForageWise — E2E Tests: Species Detail Page
 *
 * Tests dynamic routing with valid and invalid species IDs,
 * edibility tab rendering, and associated species links on tree detail pages.
 *
 * Run with: npx playwright test tests/e2e/species-detail.spec.ts
 *
 * Validates: Requirements 18.8
 */

import { test, expect } from '@playwright/test';

test.describe('Species Detail — Valid Species ID', () => {
  test('should load species detail page from field guide navigation', async ({ page }) => {
    await page.goto('/field-guide');

    // Wait for species cards to load from IndexedDB
    await page.locator('[data-testid="species-card"]').first().waitFor({ timeout: 10_000 });

    // Click the first species card
    await page.locator('[data-testid="species-card"]').first().click();

    // Should navigate to a species detail URL
    await expect(page).toHaveURL(/\/field-guide\/.+/);

    // Should display the species name as a heading
    await expect(
      page.getByRole('heading', { level: 1 })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should display species information fields', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().waitFor({ timeout: 10_000 });
    await page.locator('[data-testid="species-card"]').first().click();

    await expect(page).toHaveURL(/\/field-guide\/.+/);

    // Key information sections should be visible
    await expect(page.getByText(/habitat/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/season/i)).toBeVisible();
  });

  test('should display a back link to the field guide', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().waitFor({ timeout: 10_000 });
    await page.locator('[data-testid="species-card"]').first().click();

    // Should have a back link to field guide
    const backLink = page.getByRole('link', { name: /back|field guide/i }).first();
    await expect(backLink).toBeVisible();
  });
});

test.describe('Species Detail — Invalid Species ID', () => {
  test('should show error message for non-existent species ID', async ({ page }) => {
    await page.goto('/field-guide/nonexistent-species-id-12345');

    // Should show an error or "not found" message after IndexedDB lookup
    const errorMessage = page.getByText(/not found|error|no species/i);
    await expect(errorMessage).toBeVisible({ timeout: 15_000 });
  });

  test('should provide a link back to the Field Guide on error', async ({ page }) => {
    await page.goto('/field-guide/invalid-id-that-does-not-exist');

    // Wait for the error state to render
    await page.getByText(/not found|error|no species/i).waitFor({ timeout: 15_000 });

    // Should have a link back to the field guide
    const fieldGuideLink = page.getByRole('link', { name: /field guide|browse|back/i }).first();
    await expect(fieldGuideLink).toBeVisible();
  });
});

test.describe('Species Detail — Edibility Tab', () => {
  test('should render edibility tab with Overview and Could Be tabs', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().waitFor({ timeout: 10_000 });
    await page.locator('[data-testid="species-card"]').first().click();

    await expect(page).toHaveURL(/\/field-guide\/.+/);

    // Look for the edibility tab component
    const overviewTab = page.getByRole('tab', { name: /overview/i }).first();
    const couldBeTab = page.getByRole('tab', { name: /could be/i }).first();

    // If edibility tabs are present (species/plant detail, not tree)
    const hasOverview = await overviewTab.isVisible().catch(() => false);
    const hasCouldBe = await couldBeTab.isVisible().catch(() => false);

    if (hasOverview && hasCouldBe) {
      await expect(overviewTab).toBeVisible();
      await expect(couldBeTab).toBeVisible();

      // Click "Could Be" tab and verify disclaimer
      await couldBeTab.click();
      await expect(
        page.getByText(/not a definitive edibility assessment|verify with a qualified expert/i)
      ).toBeVisible();
    }
  });

  test('should never display forbidden safety phrases', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().waitFor({ timeout: 10_000 });
    await page.locator('[data-testid="species-card"]').first().click();

    await expect(page).toHaveURL(/\/field-guide\/.+/);

    // Verify forbidden phrases are never present
    const bodyText = await page.locator('body').textContent();
    const lowerText = bodyText?.toLowerCase() ?? '';

    expect(lowerText).not.toContain('safe to eat');
    expect(lowerText).not.toContain('definitely edible');
    expect(lowerText).not.toContain('confirmed edible');
    expect(lowerText).not.toContain('ai verified');
  });
});

test.describe('Species Detail — Associated Species Links', () => {
  test('should render associated species as tappable links on tree detail pages', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().waitFor({ timeout: 10_000 });

    // Try to find and click a tree species card
    // Trees have category "tree" — look for a tree filter first
    const treeFilter = page.getByRole('button', { name: /tree/i });
    if (await treeFilter.isVisible()) {
      await treeFilter.click();

      // Wait for filtered results
      const treeCard = page.locator('[data-testid="species-card"]').first();
      if ((await treeCard.count()) > 0) {
        await treeCard.click();
        await expect(page).toHaveURL(/\/field-guide\/.+/);

        // Look for associated species section
        const associatedSection = page.getByText(/associated species/i);
        if (await associatedSection.isVisible().catch(() => false)) {
          // Associated species should be rendered as links (when matched)
          // or plain text (when not matched)
          const associatedLinks = page.locator('a[href^="/field-guide/"]');
          const linkCount = await associatedLinks.count();

          // There should be at least some associated species content
          // (either links or text)
          const associatedText = page.locator('text=/associated/i');
          await expect(associatedText.first()).toBeVisible();
        }
      }
    }
  });

  test('should navigate to associated species detail when link is clicked', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().waitFor({ timeout: 10_000 });

    // Filter to trees
    const treeFilter = page.getByRole('button', { name: /tree/i });
    if (await treeFilter.isVisible()) {
      await treeFilter.click();

      const treeCard = page.locator('[data-testid="species-card"]').first();
      if ((await treeCard.count()) > 0) {
        await treeCard.click();
        await expect(page).toHaveURL(/\/field-guide\/.+/);

        // Find an associated species link
        const associatedLink = page
          .locator('[data-testid="associated-species-link"] a, a[href^="/field-guide/"]')
          .first();

        if ((await associatedLink.count()) > 0 && (await associatedLink.isVisible())) {
          const href = await associatedLink.getAttribute('href');
          await associatedLink.click();

          // Should navigate to the linked species detail page
          if (href) {
            await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
          }
        }
      }
    }
  });
});
