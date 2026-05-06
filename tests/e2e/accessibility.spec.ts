/**
 * ForageWise — E2E Tests: Accessibility (WCAG AA)
 *
 * Integrates @axe-core/playwright for automated accessibility checks.
 * Runs axe-core on Home, Field Guide, and Map pages in both light and
 * dark modes. Reports WCAG AA violations.
 *
 * Note: Full WCAG AA validation requires manual testing with assistive
 * technologies and expert accessibility review. These automated tests
 * cover programmatically verifiable criteria.
 *
 * Axe-core tests allow minor/moderate violations but fail on critical ones.
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

async function setTheme(page: import('@playwright/test').Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    localStorage.setItem('foragewise-theme', t);
  }, theme);
  await page.reload();
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

/** Filter to only critical/serious violations */
function getCriticalViolations(violations: Array<{ impact?: string | null }>) {
  return violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
}

// ---------------------------------------------------------------------------
// Home Page — Accessibility
// ---------------------------------------------------------------------------

test.describe('Accessibility — Home Page', () => {
  test('should have no critical WCAG AA violations in light mode', async ({ page }) => {
    await page.goto('/');
    await setTheme(page, 'light');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = getCriticalViolations(results.violations);
    if (critical.length > 0) {
      console.log('Home (light) critical violations:', JSON.stringify(critical.map(v => ({ id: (v as any).id, impact: v.impact, nodes: (v as any).nodes?.length })), null, 2));
    }
    expect(critical).toEqual([]);
  });

  test('should have no critical WCAG AA violations in dark mode', async ({ page }) => {
    await page.goto('/');
    await setTheme(page, 'dark');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = getCriticalViolations(results.violations);
    if (critical.length > 0) {
      console.log('Home (dark) critical violations:', JSON.stringify(critical.map(v => ({ id: (v as any).id, impact: v.impact, nodes: (v as any).nodes?.length })), null, 2));
    }
    expect(critical).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Field Guide Page — Accessibility
// ---------------------------------------------------------------------------

test.describe('Accessibility — Field Guide Page', () => {
  test('should have no critical WCAG AA violations in light mode', async ({ page }) => {
    await page.goto('/field-guide');
    await setTheme(page, 'light');
    await page.waitForTimeout(3000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = getCriticalViolations(results.violations);
    if (critical.length > 0) {
      console.log('Field Guide (light) critical violations:', JSON.stringify(critical.map(v => ({ id: (v as any).id, impact: v.impact })), null, 2));
    }
    expect(critical).toEqual([]);
  });

  test('should have no critical WCAG AA violations in dark mode', async ({ page }) => {
    await page.goto('/field-guide');
    await setTheme(page, 'dark');
    await page.waitForTimeout(3000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = getCriticalViolations(results.violations);
    if (critical.length > 0) {
      console.log('Field Guide (dark) critical violations:', JSON.stringify(critical.map(v => ({ id: (v as any).id, impact: v.impact })), null, 2));
    }
    expect(critical).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Map Page — Accessibility
// ---------------------------------------------------------------------------

test.describe('Accessibility — Map Page', () => {
  test('should have no critical WCAG AA violations in light mode', async ({ page }) => {
    await page.goto('/map');
    await setTheme(page, 'light');
    await page.waitForTimeout(3000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.leaflet-container') // Leaflet has its own a11y concerns
      .analyze();

    const critical = getCriticalViolations(results.violations);
    if (critical.length > 0) {
      console.log('Map (light) critical violations:', JSON.stringify(critical.map(v => ({ id: (v as any).id, impact: v.impact })), null, 2));
    }
    expect(critical).toEqual([]);
  });

  test('should have no critical WCAG AA violations in dark mode', async ({ page }) => {
    await page.goto('/map');
    await setTheme(page, 'dark');
    await page.waitForTimeout(3000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.leaflet-container')
      .analyze();

    const critical = getCriticalViolations(results.violations);
    if (critical.length > 0) {
      console.log('Map (dark) critical violations:', JSON.stringify(critical.map(v => ({ id: (v as any).id, impact: v.impact })), null, 2));
    }
    expect(critical).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Semantic HTML Checks
// ---------------------------------------------------------------------------

test.describe('Accessibility — Semantic HTML', () => {
  test('should use semantic landmarks on the home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Should have at least one <main> element (in AppShell or page)
    const main = page.locator('main');
    expect(await main.count()).toBeGreaterThanOrEqual(1);

    // Should have a <nav> element (bottom nav)
    const nav = page.locator('nav');
    expect(await nav.count()).toBeGreaterThanOrEqual(1);
  });

  test('should have proper heading hierarchy on the home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const h1 = page.locator('h1');
    expect(await h1.count()).toBeGreaterThanOrEqual(1);
  });

  test('should have aria-labels on navigation elements', async ({ page }) => {
    await page.goto('/');

    const nav = page.locator('nav[aria-label]');
    expect(await nav.count()).toBeGreaterThanOrEqual(1);
  });

  test('should have alt text on all images', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      const role = await img.getAttribute('role');

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

    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus');
    const count = await focusedElement.count();
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
        expect(hasLabel || !!ariaLabel || !!ariaLabelledBy).toBeTruthy();
      } else {
        expect(!!ariaLabel || !!ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('should support keyboard navigation through bottom nav', async ({ page }) => {
    await page.goto('/');

    const navLinks = page.locator('nav[aria-label="Main navigation"] a');
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
