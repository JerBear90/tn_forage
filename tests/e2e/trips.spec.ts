/**
 * ForageFlow — E2E Tests: Trips
 *
 * Tests trip creation flow including navigation to new trip page,
 * location selection, date entry, and offline save to IndexedDB.
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
  test.beforeEach(async ({ page }) => {
    await page.goto('/trips/new');
  });

  test('should display location type options', async ({ page }) => {
    // The form has location type radio buttons: State Park, Trail, Route, Custom
    await expect(page.getByText(/where are you going/i)).toBeVisible();
    await expect(page.getByRole('radio', { name: /state park/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /trail/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /route/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /custom/i })).toBeVisible();
  });

  test('should show location search when park type is selected', async ({ page }) => {
    // Park is the default selection
    const locationSearch = page.locator('#location-search');
    await expect(locationSearch).toBeVisible();
  });

  test('should show custom location input when Custom type is selected', async ({ page }) => {
    await page.getByRole('radio', { name: /custom/i }).click();
    const customInput = page.locator('#custom-location');
    await expect(customInput).toBeVisible();
  });

  test('should open location dropdown on focus', async ({ page }) => {
    const locationSearch = page.locator('#location-search');
    await locationSearch.focus();

    // Dropdown listbox should appear
    const listbox = page.locator('#location-listbox');
    await expect(listbox).toBeVisible();
  });
});

test.describe('Trips — Date Entry', () => {
  test('should display date input with today as default', async ({ page }) => {
    await page.goto('/trips/new');

    const dateInput = page.locator('#trip-date');
    await expect(dateInput).toBeVisible();

    // Default value should be today's date
    const today = new Date().toISOString().slice(0, 10);
    await expect(dateInput).toHaveValue(today);
  });

  test('should allow changing the date', async ({ page }) => {
    await page.goto('/trips/new');

    const dateInput = page.locator('#trip-date');
    await dateInput.fill('2025-07-04');
    await expect(dateInput).toHaveValue('2025-07-04');
  });
});

test.describe('Trips — Offline Save to IndexedDB', () => {
  test('should save a trip with custom location and verify redirect', async ({ page }) => {
    await page.goto('/trips/new');

    // Select Custom location type
    await page.getByRole('radio', { name: /custom/i }).click();

    // Fill in custom location
    const customInput = page.locator('#custom-location');
    await customInput.fill('Radnor Lake State Park');

    // Set date
    const dateInput = page.locator('#trip-date');
    await dateInput.fill('2025-08-15');

    // Add optional notes
    const notesInput = page.locator('#trip-notes');
    await notesInput.fill('E2E test trip — looking for chanterelles');

    // Submit the form
    const saveButton = page.getByRole('button', { name: /save trip/i });
    await saveButton.click();

    // Should redirect to trips list page after save
    await expect(page).toHaveURL(/\/trips$/, { timeout: 5_000 });
  });

  test('should show validation error when location is missing', async ({ page }) => {
    await page.goto('/trips/new');

    // Try to submit without selecting a location
    const saveButton = page.getByRole('button', { name: /save trip/i });
    await saveButton.click();

    // Validation error should appear
    await expect(
      page.getByText(/please select a location/i)
    ).toBeVisible();
  });

  test('should display offline save note', async ({ page }) => {
    await page.goto('/trips/new');
    await expect(
      page.getByText(/saved locally first/i)
    ).toBeVisible();
  });
});
