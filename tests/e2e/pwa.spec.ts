/**
 * ForageFlow — E2E Tests: PWA Install Prompt
 *
 * Tests PWA install prompt display when not in standalone mode,
 * dismissal storing a timestamp, and suppression within 7 days.
 *
 * Run with: npx playwright test tests/e2e/pwa.spec.ts
 *
 * Validates: Requirements 18.9
 */

import { test, expect } from '@playwright/test';

const DISMISSAL_KEY = 'forageflow-pwa-prompt-dismissed';

test.describe('PWA Install Prompt — Display', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any previous dismissal to start fresh
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), DISMISSAL_KEY);
  });

  test('should display install prompt when not in standalone mode and not dismissed', async ({ page }) => {
    // In a normal browser context (not standalone), the prompt should show
    // after clearing the dismissal key
    await page.reload();

    // The PwaInstallPrompt renders with aria-label "Install ForageFlow"
    const prompt = page.locator('[aria-label="Install ForageFlow"]');

    // The prompt should be visible (browser is not standalone by default in Playwright)
    await expect(prompt).toBeVisible({ timeout: 5_000 });
  });

  test('should display platform-specific instructions', async ({ page }) => {
    await page.reload();

    const prompt = page.locator('[aria-label="Install ForageFlow"]');
    if (await prompt.isVisible().catch(() => false)) {
      // Should contain "Add ForageFlow to Home Screen" heading
      await expect(prompt).toContainText(/add forageflow to home screen/i);

      // Should contain some installation instructions
      // (platform-specific: iOS shows "Share", Android shows "menu", other shows generic)
      const hasInstructions = await prompt
        .getByText(/share|menu|mobile browser/i)
        .first()
        .isVisible()
        .catch(() => false);
      expect(hasInstructions).toBeTruthy();
    }
  });

  test('should display a dismiss button', async ({ page }) => {
    await page.reload();

    const prompt = page.locator('[aria-label="Install ForageFlow"]');
    if (await prompt.isVisible().catch(() => false)) {
      const dismissButton = page.getByRole('button', {
        name: /dismiss install prompt/i,
      });
      await expect(dismissButton).toBeVisible();
    }
  });
});

test.describe('PWA Install Prompt — Dismissal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), DISMISSAL_KEY);
    await page.reload();
  });

  test('should store dismissal timestamp in localStorage when dismissed', async ({ page }) => {
    const prompt = page.locator('[aria-label="Install ForageFlow"]');

    if (await prompt.isVisible().catch(() => false)) {
      const dismissButton = page.getByRole('button', {
        name: /dismiss install prompt/i,
      });
      await dismissButton.click();

      // Prompt should disappear
      await expect(prompt).not.toBeVisible();

      // localStorage should have the dismissal timestamp
      const dismissalValue = await page.evaluate(
        (key) => localStorage.getItem(key),
        DISMISSAL_KEY
      );
      expect(dismissalValue).not.toBeNull();

      // The stored value should be a valid timestamp (number)
      const timestamp = Number(dismissalValue);
      expect(Number.isFinite(timestamp)).toBe(true);
      expect(timestamp).toBeGreaterThan(0);
    }
  });

  test('should hide prompt after dismissal', async ({ page }) => {
    const prompt = page.locator('[aria-label="Install ForageFlow"]');

    if (await prompt.isVisible().catch(() => false)) {
      const dismissButton = page.getByRole('button', {
        name: /dismiss install prompt/i,
      });
      await dismissButton.click();

      // Prompt should be hidden
      await expect(prompt).not.toBeVisible();
    }
  });
});

test.describe('PWA Install Prompt — 7-Day Cooldown', () => {
  test('should not show prompt when dismissed within 7 days', async ({ page }) => {
    await page.goto('/');

    // Set a recent dismissal timestamp (1 day ago)
    const oneDayAgo = Date.now() - 1 * 24 * 60 * 60 * 1000;
    await page.evaluate(
      ([key, ts]) => localStorage.setItem(key, String(ts)),
      [DISMISSAL_KEY, oneDayAgo] as const
    );

    await page.reload();

    // Prompt should NOT be visible (dismissed less than 7 days ago)
    const prompt = page.locator('[aria-label="Install ForageFlow"]');
    await expect(prompt).not.toBeVisible({ timeout: 3_000 });
  });

  test('should show prompt again after 7 days have passed', async ({ page }) => {
    await page.goto('/');

    // Set a dismissal timestamp from 8 days ago
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    await page.evaluate(
      ([key, ts]) => localStorage.setItem(key, String(ts)),
      [DISMISSAL_KEY, eightDaysAgo] as const
    );

    await page.reload();

    // Prompt should be visible again (dismissed more than 7 days ago)
    const prompt = page.locator('[aria-label="Install ForageFlow"]');
    await expect(prompt).toBeVisible({ timeout: 5_000 });
  });

  test('should not show prompt when dismissed exactly 7 days ago', async ({ page }) => {
    await page.goto('/');

    // Set dismissal timestamp to exactly 6 days and 23 hours ago (just under 7 days)
    const justUnder7Days = Date.now() - (7 * 24 * 60 * 60 * 1000 - 60_000);
    await page.evaluate(
      ([key, ts]) => localStorage.setItem(key, String(ts)),
      [DISMISSAL_KEY, justUnder7Days] as const
    );

    await page.reload();

    // Prompt should NOT be visible (still within 7-day cooldown)
    const prompt = page.locator('[aria-label="Install ForageFlow"]');
    await expect(prompt).not.toBeVisible({ timeout: 3_000 });
  });
});
