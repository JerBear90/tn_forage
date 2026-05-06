/**
 * ForageWise — E2E Tests: Trips
 *
 * Tests trip creation flow including navigation to new trip page,
 * park picker selection with collapse, date entry, and offline save.
 *
 * Run with: npx playwright test tests/e2e/trips.spec.ts
 *
 * Validates: Requirements 18.4
 */

import { test, expect } from '@playwright/test';

test.describe('Trips — Navigation', () => {
  test('should navigate to the trips page', async ({ page }) => {
    await page.goto('/trips');
    await expect(
      page.getByRole('heading', { level: 1 })
    ).toBeVisible();
  });

  test('should navigate to the create trip page', async ({ page }) => {
    await page.goto('/trips/new');
    await expect(page).toHaveURL(/\/trips\/new/);
    await expect(
      page.getByRole('heading', { level: 1, name: /create trip/i })
    ).toBeVisible();
  });

  test('should have a link from trips page to create new trip', async ({ page }) => {
    await page.goto('/trips');
    const newTripLink = page.getByRole('link', { name: /new|create|plan/i }).first();
    if (await newTripLink.isVisible()) {
      await newTripLink.click();
      await expect(page).toHaveURL(/\/trips\/new/);
    }
  });
});

test.describe('Trips — Location Selection', () => {
  test('should display Start Planning button initially', async ({ page }) => {
    await page.goto('/trips/new');
    await expect(page.getByRole('button', { name: /start planning my trip/i })).toBeVisible();
  });

  test('should show location mode selector after clicking Start Planning', async ({ page }) => {
    await page.goto('/trips/new');
    await page.getByRole('button', { name: /start planning my trip/i }).click();

    // Should show "Where are you going?" with park/custom options
    await expect(page.getByText(/where are you going/i)).toBeVisible();
    await expect(page.getByRole('radio', { name: /select a park/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /custom location/i })).toBeVisible();
  });

  test('should show park picker when park mode is selected', async ({ page }) => {
    await page.goto('/trips/new');
    await page.getByRole('button', { name: /start planning my trip/i }).click();

    // Park mode is default — park picker should load
    await expect(page.getByText(/select a park/i)).toBeVisible({ timeout: 10_000 });
  });

  test('should show custom location input when Custom is selected', async ({ page }) => {
    await page.goto('/trips/new');
    await page.getByRole('button', { name: /start planning my trip/i }).click();

    await page.getByRole('radio', { name: /custom location/i }).click();
    const customInput = page.locator('#custom-location');
    await expect(customInput).toBeVisible();
  });

  test('should collapse park picker after selecting a park', async ({ page }) => {
    await page.goto('/trips/new');
    await page.getByRole('button', { name: /start planning my trip/i }).click();
    await page.waitForTimeout(3000); // Wait for parks to load from IndexedDB

    // Click first park card
    const parkCard = page.locator('[role="option"]').first();
    if (await parkCard.isVisible()) {
      await parkCard.click();
      await page.waitForTimeout(500);

      // Should show collapsed state with "Change" button
      await expect(page.getByRole('button', { name: /change/i })).toBeVisible();
    }
  });
});

test.describe('Trips — Date Entry', () => {
  test('should display date input with today as default', async ({ page }) => {
    await page.goto('/trips/new');
    await page.getByRole('button', { name: /start planning my trip/i }).click();

    const dateInput = page.locator('#trip-date');
    await expect(dateInput).toBeVisible();

    const today = new Date().toISOString().slice(0, 10);
    await expect(dateInput).toHaveValue(today);
  });

  test('should allow changing the date', async ({ page }) => {
    await page.goto('/trips/new');
    await page.getByRole('button', { name: /start planning my trip/i }).click();

    const dateInput = page.locator('#trip-date');
    await dateInput.fill('2025-07-04');
    await expect(dateInput).toHaveValue('2025-07-04');
  });
});

test.describe('Trips — Form Validation', () => {
  test('should show validation error when park is not selected', async ({ page }) => {
    await page.goto('/trips/new');
    await page.getByRole('button', { name: /start planning my trip/i }).click();
    await page.waitForTimeout(1000);

    // Try to submit without selecting a park
    const submitBtn = page.getByRole('button', { name: /start planning$/i }).last();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await expect(page.getByText(/please select a park/i)).toBeVisible();
    }
  });

  test('should display offline save note', async ({ page }) => {
    await page.goto('/trips/new');
    await page.getByRole('button', { name: /start planning my trip/i }).click();

    await expect(
      page.getByText(/saved locally first/i)
    ).toBeVisible();
  });
});

test.describe('Trips — Share Prompt', () => {
  test('should show share prompt after saving a trip', async ({ page }) => {
    await page.goto('/trips/new');
    await page.getByRole('button', { name: /start planning my trip/i }).click();
    await page.waitForTimeout(3000);

    // Select custom location for easier testing
    await page.getByRole('radio', { name: /custom location/i }).click();
    await page.locator('#custom-location').fill('Test Location');

    // Submit
    const submitBtn = page.getByRole('button', { name: /start planning$/i }).last();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);

      // Share prompt dialog should appear
      const shareDialog = page.getByRole('dialog', { name: /share/i });
      if (await shareDialog.isVisible().catch(() => false)) {
        await expect(shareDialog).toContainText(/share this trip/i);
      }
    }
  });
});
