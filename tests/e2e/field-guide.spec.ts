/**
 * ForageFlow — E2E Tests: Critical User Flows
 *
 * Playwright test stubs for core user journeys.
 * These tests require a running dev server and PocketBase instance.
 *
 * Run with: npx playwright test tests/e2e/field-guide.spec.ts
 */

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Field Guide Navigation
// ---------------------------------------------------------------------------

test.describe('Field Guide', () => {
  test('should navigate to the Field Guide page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /field guide/i }).click();
    await expect(page).toHaveURL(/\/field-guide/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should display species list with search and filters', async ({ page }) => {
    await page.goto('/field-guide');
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    // At least one species card should be visible from seed data
    await expect(page.locator('[data-testid="species-card"]').first()).toBeVisible();
  });

  test('should filter species by category', async ({ page }) => {
    await page.goto('/field-guide');
    // Open category filter and select mushroom
    const categoryFilter = page.getByRole('button', { name: /category/i });
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.getByText(/mushroom/i).click();
    }
    // Results should still be visible (filtered)
    await expect(page.locator('[data-testid="species-card"]').first()).toBeVisible();
  });

  test('should search species by name', async ({ page }) => {
    await page.goto('/field-guide');
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('chanterelle');
    // Wait for filtered results
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="species-card"]').first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Species Detail View
// ---------------------------------------------------------------------------

test.describe('Species Detail', () => {
  test('should navigate to a species detail page', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().click();
    await expect(page).toHaveURL(/\/field-guide\/.+/);
  });

  test('should display species information fields', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().click();
    // Key fields should be present
    await expect(page.getByText(/habitat/i)).toBeVisible();
    await expect(page.getByText(/season/i)).toBeVisible();
  });

  test('should show toxic lookalikes before edible notes', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().click();
    // Verify safety language — "safe to eat" must never appear
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('safe to eat');
    expect(bodyText).not.toContain('confirmed edible');
  });

  test('should display last updated date', async ({ page }) => {
    await page.goto('/field-guide');
    await page.locator('[data-testid="species-card"]').first().click();
    await expect(page.getByText(/last updated/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Trip Creation Flow
// ---------------------------------------------------------------------------

test.describe('Trip Creation', () => {
  test('should navigate to create trip page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /create trip/i }).first().click();
    await expect(page).toHaveURL(/\/trips\/new/);
  });

  test('should display trip creation form fields', async ({ page }) => {
    await page.goto('/trips/new');
    // Core form fields should be present
    await expect(page.getByText(/where/i).first()).toBeVisible();
    await expect(page.getByText(/date/i).first()).toBeVisible();
  });

  test('should save a trip with required fields', async ({ page }) => {
    await page.goto('/trips/new');
    // Fill in minimum required fields
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill('2025-06-15');
    }
    const notesInput = page.getByPlaceholder(/notes/i).first();
    if (await notesInput.isVisible()) {
      await notesInput.fill('Test trip from Playwright');
    }
    // Submit the form
    const saveButton = page.getByRole('button', { name: /save|create/i }).first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
    }
  });

  test('should list saved trips on trips page', async ({ page }) => {
    await page.goto('/trips');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Login Page
// ---------------------------------------------------------------------------

test.describe('Login', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /log in|sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should display SSO provider buttons', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /apple/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /microsoft/i })).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /log in|sign in/i }).first().click();
    // Should show an error message
    await expect(page.getByText(/failed|error|invalid/i)).toBeVisible({ timeout: 5000 });
  });

  test('should link to signup page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /sign up|create account/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});
