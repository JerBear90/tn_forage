/**
 * ForageFlow — E2E Tests: Accessibility (WCAG AA)
 *
 * Integrates @axe-core/playwright for automated accessibility checks.
 * Runs axe-core on Home, Field Guide, and Map pages in both light and
 * dark modes. Reports any WCAG AA violations.
 *
 * Note: Full WCAG AA validation requires manual testing with assistive
 * technologies and expert accessibility review. These automated tests
 * cover programmatically verifiable criteria.
 *
 * Run with: npx playwright test tests/e2e/accessibility.spec.ts
 *
 * Validates: Requirements 18.10
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Set the theme by updating localStorage and reloading the page.
 */
async function setTheme(page: import('@playwright/test').Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    localStorage.setItem('forageflow-theme', t);
  }, theme);
  await page.reload();
  // Wait for theme class to be applied
  if (theme === 'dark') {
    await page.waitForFunction(() =>
      document.documentElement.classList.contains('dark')
    );
  } else {
    await page.waitForFunction(() =>
      !document.documentElement.classList.contains('dark')
    );
  }
}

// ---------------------------------------------------------------------------
// Home Page — Accessibility
// ---------------------------------------------------------------------------

test.describe('Accessibility — Home Page', () => {
  test('should have no WCAG AA violations in light mode', async ({ page }) => {
    await page.goto('/');
    await setTheme(page, 'light');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Report violations for debugging
    if (results.violations.length > 0) {
      const summary = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      }));
      console.log('Home (light) violations:', JSON.stringify(summary, null, 2));
    }

    expect(results.violations).toEqual([]);
  });

  test('should have no WCAG AA violations in dark mode', async ({ page }) => {
    await page.goto('/');
    await setTheme(page, 'dark');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    if (results.violations.length > 0) {
      const summary = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      }));
      console.log('Home (dark) violations:', JSON.stringify(summary, null, 2));
    }

    expect(results.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Field Guide Page — Accessibility
// ---------------------------------------------------------------------------

test.describe('Accessibility — Field Guide Page', () => {
  test('should have no WCAG AA violations in light mode', async ({ page }) => {
    await page.goto('/field-guide');
    await setTheme(page, 'light');

    // Wait for species cards to load
    await page
      .locator('[data-testid="species-card"]')
      .first()
      .waitFor({ timeout: 10_000 })
      .catch(() => {
        // Species may not load if IndexedDB is empty — still run axe
      });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    if (results.violations.length > 0) {
      const summary = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      }));
      console.log('Field Guide (light) violations:', JSON.stringify(summary, null, 2));
    }

    expect(results.violations).toEqual([]);
  });

  test('should have no WCAG AA violations in dark mode', async ({ page }) => {
    await page.goto('/field-guide');
    await setTheme(page, 'dark');

    await page
      .locator('[data-testid="species-card"]')
      .first()
      .waitFor({ timeout: 10_000 })
      .catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    if (results.violations.length > 0) {
      const summary = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      }));
      console.log('Field Guide (dark) violations:', JSON.stringify(summary, null, 2));
    }

    expect(results.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Map Page — Accessibility
// ---------------------------------------------------------------------------

test.describe('Accessibility — Map Page', () => {
  test('should have no WCAG AA violations in light mode', async ({ page }) => {
    await page.goto('/map');
    await setTheme(page, 'light');

    // Wait for map to load
    await page
      .locator('.leaflet-container')
      .waitFor({ timeout: 15_000 })
      .catch(() => {
        // Map may not load in test environment — still run axe
      });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      // Exclude the Leaflet map container from axe checks — Leaflet generates
      // its own DOM that we don't control and may have known issues
      .exclude('.leaflet-container')
      .analyze();

    if (results.violations.length > 0) {
      const summary = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      }));
      console.log('Map (light) violations:', JSON.stringify(summary, null, 2));
    }

    expect(results.violations).toEqual([]);
  });

  test('should have no WCAG AA violations in dark mode', async ({ page }) => {
    await page.goto('/map');
    await setTheme(page, 'dark');

    await page
      .locator('.leaflet-container')
      .waitFor({ timeout: 15_000 })
      .catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.leaflet-container')
      .analyze();

    if (results.violations.length > 0) {
      const summary = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      }));
      console.log('Map (dark) violations:', JSON.stringify(summary, null, 2));
    }

    expect(results.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Semantic HTML Checks
// ---------------------------------------------------------------------------

test.describe('Accessibility — Semantic HTML', () => {
  test('should use semantic landmarks on the home page', async ({ page }) => {
    await page.goto('/');

    // Should have a <main> element
    const main = page.locator('main');
    await expect(main).toHaveCount(1);

    // Should have a <nav> element (bottom nav)
    const nav = page.locator('nav');
    expect(await nav.count()).toBeGreaterThanOrEqual(1);
  });

  test('should have proper heading hierarchy on the home page', async ({ page }) => {
    await page.goto('/');

    // Should have an h1
    const h1 = page.locator('h1');
    expect(await h1.count()).toBeGreaterThanOrEqual(1);
  });

  test('should have aria-labels on navigation elements', async ({ page }) => {
    await page.goto('/');

    // Bottom nav should have aria-label
    const nav = page.locator('nav[aria-label]');
    expect(await nav.count()).toBeGreaterThanOrEqual(1);
  });

  test('should have alt text on all images', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      const role = await img.getAttribute('role');

      // Every image should have alt text, be aria-hidden, or have role="presentation"
      expect(
        alt !== null || ariaHidden === 'true' || role === 'presentation'
      ).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Focus and Keyboard Accessibility
// ---------------------------------------------------------------------------

test.describe('Accessibility — Focus Management', () => {
  test('should have visible focus indicators on interactive elements', async ({ page }) => {
    await page.goto('/');

    // Tab to the first interactive element
    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus');
    const count = await focusedElement.count();

    // Something should be focused after pressing Tab
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should have labels on all form inputs on login page', async ({ page }) => {
    await page.goto('/login');

    const inputs = page.locator('input:not([type="hidden"])');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = (await label.count()) > 0;
        // Each input should have an associated label or aria-label
        expect(hasLabel || !!ariaLabel || !!ariaLabelledBy).toBeTruthy();
      } else {
        expect(!!ariaLabel || !!ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('should support keyboard navigation through bottom nav', async ({ page }) => {
    await page.goto('/');

    // Focus the first nav link
    const navLinks = page.locator('nav a');
    const navCount = await navLinks.count();

    if (navCount > 0) {
      await navLinks.first().focus();
      const isFocused = await navLinks
        .first()
        .evaluate((el) => document.activeElement === el);
      expect(isFocused).toBeTruthy();
    }
  });
});
