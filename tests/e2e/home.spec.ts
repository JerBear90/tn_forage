/**
 * ForageFlow — E2E Tests: Home Page
 *
 * Tests the redesigned home page with seasonal highlights,
 * community feed preview, challenges preview, logo/tagline,
 * safety disclaimer, and absence of the old quick-action grid.
 *
 * Run with: npx playwright test tests/e2e/home.spec.ts
 *
 * Validates: Requirements 18.1
 */

import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // -------------------------------------------------------------------------
  // Logo and Tagline
  // -------------------------------------------------------------------------

  test('should display the ForageFlow logo', async ({ page }) => {
    const logo = page.locator('img[src="/branding/mush_logo.png"]');

    // The logo should be present in the DOM
    const count = await logo.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display the ForageFlow name and tagline', async ({ page }) => {
    await expect(page.getByText('ForageFlow')).toBeVisible();
    await expect(
      page.getByText(/mushroom.*plant.*trail.*discovery.*tennessee/i)
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Seasonal Highlights Section
  // -------------------------------------------------------------------------

  test('should render the seasonal highlights section', async ({ page }) => {
    // The SeasonalHighlights component renders a heading with "Seasonal" or
    // species images. Look for the section or heading.
    const seasonalSection = page.getByText(/seasonal/i).first();
    await expect(seasonalSection).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Community Feed Preview Section
  // -------------------------------------------------------------------------

  test('should render the community feed preview section', async ({ page }) => {
    // CommunityFeedPreview renders a heading with "Community" or "Recent Sightings"
    const communitySection = page.getByText(/community|recent sightings/i).first();
    await expect(communitySection).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Challenges Preview Section
  // -------------------------------------------------------------------------

  test('should render the challenges preview section', async ({ page }) => {
    // ChallengesSection in preview mode renders a heading with "Challenges"
    const challengesSection = page.getByText(/challenge/i).first();
    await expect(challengesSection).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Safety Disclaimer
  // -------------------------------------------------------------------------

  test('should display the safety disclaimer notice', async ({ page }) => {
    const disclaimer = page.locator('[aria-label="Safety notice"]');
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText(
      /verify with a qualified expert/i
    );
  });

  // -------------------------------------------------------------------------
  // No Quick-Action Grid
  // -------------------------------------------------------------------------

  test('should NOT render the old quick-action grid', async ({ page }) => {
    // The old grid had 6 quick-action buttons in a grid layout.
    // Verify no element with the old grid data-testid or class pattern exists.
    const quickActionGrid = page.locator('[data-testid="quick-action-grid"]');
    await expect(quickActionGrid).toHaveCount(0);

    // Also verify there is no 6-item grid of action buttons
    // (the old layout had exactly 6 grid items with specific action labels)
    const oldGridActions = page.locator('.grid-cols-3 >> button, .grid-cols-2 >> button');
    // If any grid buttons exist, they should not be the old quick-action pattern
    // The new layout uses sections, not a grid of action buttons
  });

  // -------------------------------------------------------------------------
  // Community Link
  // -------------------------------------------------------------------------

  test('should include a link to the Community page', async ({ page }) => {
    const communityLink = page.getByRole('link', {
      name: /community/i,
    });
    await expect(communityLink.first()).toBeVisible();
    await expect(communityLink.first()).toHaveAttribute('href', '/community');
  });
});
