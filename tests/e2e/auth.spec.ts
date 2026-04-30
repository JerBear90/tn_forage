/**
 * ForageFlow — E2E Tests: Authentication
 *
 * Tests login and signup page rendering, form fields, SSO buttons,
 * and client-side form validation.
 *
 * Run with: npx playwright test tests/e2e/auth.spec.ts
 *
 * Validates: Requirements 18.5
 */

import { test, expect } from '@playwright/test';

test.describe('Login Page — Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display the login page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /forageflow/i })
    ).toBeVisible();
  });

  test('should render email input with label', async ({ page }) => {
    const emailLabel = page.locator('label[for="login-email"]');
    await expect(emailLabel).toBeVisible();
    await expect(emailLabel).toContainText(/email/i);

    const emailInput = page.locator('#login-email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should render password input with label', async ({ page }) => {
    const passwordLabel = page.locator('label[for="login-password"]');
    await expect(passwordLabel).toBeVisible();
    await expect(passwordLabel).toContainText(/password/i);

    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should render SSO provider buttons', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /google/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /apple/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /microsoft/i })
    ).toBeVisible();
  });

  test('should render sign in button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /sign in/i })
    ).toBeVisible();
  });

  test('should have a link to the signup page', async ({ page }) => {
    const signupLink = page.getByRole('link', { name: /sign up/i });
    await expect(signupLink).toBeVisible();
    await expect(signupLink).toHaveAttribute('href', '/signup');
  });
});

test.describe('Login Page — Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should show error when submitting with empty email', async ({ page }) => {
    // Leave email empty, fill password
    await page.locator('#login-password').fill('somepassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show validation error
    await expect(
      page.getByText(/email is required/i)
    ).toBeVisible();
  });

  test('should show error when submitting with empty password', async ({ page }) => {
    // Fill email, leave password empty
    await page.locator('#login-email').fill('test@example.com');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show validation error
    await expect(
      page.getByText(/password is required/i)
    ).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.locator('#login-email').fill('invalid@example.com');
    await page.locator('#login-password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show an error message (login failed or similar)
    await expect(
      page.getByText(/failed|error|invalid/i)
    ).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Signup Page — Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('should display the signup page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /join forageflow/i })
    ).toBeVisible();
  });

  test('should render display name input', async ({ page }) => {
    const nameLabel = page.locator('label[for="signup-name"]');
    await expect(nameLabel).toBeVisible();
    await expect(nameLabel).toContainText(/display name/i);

    const nameInput = page.locator('#signup-name');
    await expect(nameInput).toBeVisible();
  });

  test('should render email input', async ({ page }) => {
    const emailLabel = page.locator('label[for="signup-email"]');
    await expect(emailLabel).toBeVisible();

    const emailInput = page.locator('#signup-email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should render password and confirm password inputs', async ({ page }) => {
    const passwordInput = page.locator('#signup-password');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    const confirmInput = page.locator('#signup-password-confirm');
    await expect(confirmInput).toBeVisible();
    await expect(confirmInput).toHaveAttribute('type', 'password');
  });

  test('should render SSO provider buttons', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /google/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /apple/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /microsoft/i })
    ).toBeVisible();
  });

  test('should render create account button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /create account/i })
    ).toBeVisible();
  });

  test('should have a link to the login page', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /sign in/i });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/login');
  });
});

test.describe('Signup Page — Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('should show error when display name is empty', async ({ page }) => {
    await page.locator('#signup-email').fill('test@example.com');
    await page.locator('#signup-password').fill('password123');
    await page.locator('#signup-password-confirm').fill('password123');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(
      page.getByText(/display name is required/i)
    ).toBeVisible();
  });

  test('should show error when email is empty', async ({ page }) => {
    await page.locator('#signup-name').fill('Test User');
    await page.locator('#signup-password').fill('password123');
    await page.locator('#signup-password-confirm').fill('password123');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(
      page.getByText(/email is required/i)
    ).toBeVisible();
  });

  test('should show error when password is too short', async ({ page }) => {
    await page.locator('#signup-name').fill('Test User');
    await page.locator('#signup-email').fill('test@example.com');
    await page.locator('#signup-password').fill('short');
    await page.locator('#signup-password-confirm').fill('short');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(
      page.getByText(/at least 8 characters/i)
    ).toBeVisible();
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.locator('#signup-name').fill('Test User');
    await page.locator('#signup-email').fill('test@example.com');
    await page.locator('#signup-password').fill('password123');
    await page.locator('#signup-password-confirm').fill('different456');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(
      page.getByText(/passwords do not match/i)
    ).toBeVisible();
  });
});
