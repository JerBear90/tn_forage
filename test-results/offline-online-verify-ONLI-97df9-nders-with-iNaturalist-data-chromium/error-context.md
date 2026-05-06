# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-online-verify.spec.ts >> ONLINE — Core Features >> species detail page renders with iNaturalist data
- Location: tests\e2e\offline-online-verify.spec.ts:31:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/field-guide/sp-chanterelle", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - img [ref=e3]
    - paragraph [ref=e4]: ForageWise
  - banner [ref=e5]:
    - link "Home" [ref=e6] [cursor=pointer]:
      - /url: /
      - img [ref=e7]
      - generic [ref=e9]: ForageWise
    - generic [ref=e10]:
      - button "Weather and online features" [ref=e11] [cursor=pointer]:
        - generic [ref=e12]: 🌤️
      - button "Open search" [ref=e13] [cursor=pointer]:
        - img [ref=e14]
      - link "Contact support" [ref=e17] [cursor=pointer]:
        - /url: mailto:studio7inquiry@gmail.com?subject=ForageWise%20Support
        - img [ref=e18]
      - button "Share ForageWise" [ref=e20] [cursor=pointer]:
        - img [ref=e21]
      - link "Profile" [ref=e23] [cursor=pointer]:
        - /url: /profile
        - img [ref=e25]
  - generic [ref=e27]:
    - main [ref=e28]:
      - main [ref=e29]:
        - navigation "Breadcrumb navigation" [ref=e30]:
          - button "Back to Field Guide" [ref=e31] [cursor=pointer]:
            - img [ref=e32]
            - generic [ref=e34]: Field Guide
        - status "Loading species details" [ref=e35]:
          - generic [ref=e73]: Loading species details…
    - contentinfo [ref=e74]:
      - link "Need help? Contact Support" [ref=e75] [cursor=pointer]:
        - /url: /support
        - img [ref=e76]
        - text: Need help? Contact Support
      - paragraph [ref=e78]: © 2026 ForageWise. All rights reserved.
  - navigation "Main navigation" [ref=e79]:
    - list [ref=e80]:
      - listitem [ref=e81]:
        - link "Field Guide" [ref=e82] [cursor=pointer]:
          - /url: /field-guide
          - img [ref=e83]
          - generic [ref=e85]: Field Guide
      - listitem [ref=e86]:
        - link "Map" [ref=e87] [cursor=pointer]:
          - /url: /map
          - img [ref=e88]
          - generic [ref=e90]: Map
      - listitem [ref=e91]:
        - link "ID" [ref=e92] [cursor=pointer]:
          - /url: /identify
          - img [ref=e93]
          - generic [ref=e95]: ID
      - listitem [ref=e96]:
        - link "Community" [ref=e97] [cursor=pointer]:
          - /url: /community
          - img [ref=e98]
          - generic [ref=e100]: Community
      - listitem [ref=e101]:
        - link "Plan" [ref=e102] [cursor=pointer]:
          - /url: /parks
          - img [ref=e103]
          - generic [ref=e105]: Plan
```

# Test source

```ts
  1   | /**
  2   |  * ForageWise — E2E Verification: Offline & Online Functionality
  3   |  *
  4   |  * Verifies that core features work both online and offline.
  5   |  * This is the definitive test that proves the offline-first architecture.
  6   |  *
  7   |  * Run with: npx playwright test tests/e2e/offline-online-verify.spec.ts
  8   |  */
  9   | 
  10  | import { test, expect } from '@playwright/test';
  11  | 
  12  | // ---------------------------------------------------------------------------
  13  | // ONLINE TESTS — Features that work with internet
  14  | // ---------------------------------------------------------------------------
  15  | 
  16  | test.describe('ONLINE — Core Features', () => {
  17  |   test('home page loads with all sections', async ({ page }) => {
  18  |     await page.goto('/');
  19  |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  20  |     // QuickCapture button should be visible
  21  |     await expect(page.getByRole('button', { name: /quick capture/i })).toBeVisible();
  22  |   });
  23  | 
  24  |   test('field guide loads species from IndexedDB', async ({ page }) => {
  25  |     await page.goto('/field-guide');
  26  |     await page.waitForTimeout(5000); // Wait for IndexedDB seed
  27  |     const cards = page.locator('a[href^="/field-guide/sp-"], a[href^="/field-guide/pl-"], a[href^="/field-guide/tree-"]');
  28  |     expect(await cards.count()).toBeGreaterThan(0);
  29  |   });
  30  | 
  31  |   test('species detail page renders with iNaturalist data', async ({ page }) => {
> 32  |     await page.goto('/field-guide/sp-chanterelle');
      |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  33  |     await page.waitForTimeout(5000);
  34  |     // Should show species name
  35  |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  36  |     // Should show habitat section
  37  |     await expect(page.getByText(/habitat/i)).toBeVisible();
  38  |   });
  39  | 
  40  |   test('map page loads with controls', async ({ page }) => {
  41  |     await page.goto('/map');
  42  |     await page.waitForTimeout(3000);
  43  |     await expect(page.getByRole('heading', { name: /map/i })).toBeVisible();
  44  |     // Download map button should be visible
  45  |     await expect(page.getByRole('button', { name: /download map/i })).toBeVisible();
  46  |   });
  47  | 
  48  |   test('trips page loads', async ({ page }) => {
  49  |     await page.goto('/trips');
  50  |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  51  |   });
  52  | 
  53  |   test('community page loads for guests', async ({ page }) => {
  54  |     await page.goto('/community');
  55  |     await page.waitForTimeout(3000);
  56  |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  57  |   });
  58  | 
  59  |   test('profile page loads', async ({ page }) => {
  60  |     await page.goto('/profile');
  61  |     await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
  62  |     // Life list should be visible
  63  |     await expect(page.getByText(/species/i)).toBeVisible();
  64  |   });
  65  | 
  66  |   test('survival toolkit page loads', async ({ page }) => {
  67  |     await page.goto('/survival');
  68  |     await expect(page.getByRole('heading', { name: /survival/i })).toBeVisible();
  69  |     await expect(page.getByText(/never eat/i)).toBeVisible();
  70  |   });
  71  | 
  72  |   test('support page loads with form', async ({ page }) => {
  73  |     await page.goto('/support');
  74  |     await expect(page.getByRole('heading', { name: /support/i })).toBeVisible();
  75  |     await expect(page.locator('#support-page')).toBeVisible();
  76  |   });
  77  | 
  78  |   test('weather panel opens on tap', async ({ page }) => {
  79  |     await page.goto('/');
  80  |     await page.waitForTimeout(2000);
  81  |     // Click weather button in header
  82  |     const weatherBtn = page.getByRole('button', { name: /weather/i });
  83  |     await weatherBtn.click();
  84  |     // Panel should open
  85  |     await expect(page.getByRole('dialog', { name: /weather/i })).toBeVisible();
  86  |   });
  87  | 
  88  |   test('signup page shows only Google SSO', async ({ page }) => {
  89  |     await page.goto('/signup');
  90  |     await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  91  |     await expect(page.getByRole('button', { name: /apple/i })).not.toBeVisible();
  92  |     await expect(page.getByRole('button', { name: /microsoft/i })).not.toBeVisible();
  93  |   });
  94  | });
  95  | 
  96  | // ---------------------------------------------------------------------------
  97  | // OFFLINE TESTS — Features that must work without internet
  98  | // ---------------------------------------------------------------------------
  99  | 
  100 | test.describe('OFFLINE — Core Features Must Still Work', () => {
  101 |   test('field guide works offline after initial load', async ({ page, context }) => {
  102 |     // Load online first to seed IndexedDB
  103 |     await page.goto('/field-guide');
  104 |     await page.waitForTimeout(5000);
  105 | 
  106 |     // Verify data loaded
  107 |     const cardsOnline = page.locator('a[href^="/field-guide/sp-"], a[href^="/field-guide/pl-"], a[href^="/field-guide/tree-"]');
  108 |     expect(await cardsOnline.count()).toBeGreaterThan(0);
  109 | 
  110 |     // Go offline
  111 |     await context.setOffline(true);
  112 |     await page.reload();
  113 |     await page.waitForTimeout(3000);
  114 | 
  115 |     // Species should still be visible from IndexedDB
  116 |     const cardsOffline = page.locator('a[href^="/field-guide/sp-"], a[href^="/field-guide/pl-"], a[href^="/field-guide/tree-"]');
  117 |     expect(await cardsOffline.count()).toBeGreaterThan(0);
  118 | 
  119 |     await context.setOffline(false);
  120 |   });
  121 | 
  122 |   test('species detail works offline', async ({ page, context }) => {
  123 |     await page.goto('/field-guide/sp-chanterelle');
  124 |     await page.waitForTimeout(5000);
  125 |     await expect(page.getByText(/habitat/i)).toBeVisible();
  126 | 
  127 |     await context.setOffline(true);
  128 |     await page.reload();
  129 |     await page.waitForTimeout(3000);
  130 | 
  131 |     // Core content should still render from IndexedDB
  132 |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
```