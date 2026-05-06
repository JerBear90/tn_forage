# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-online-verify.spec.ts >> ONLINE — Core Features >> map page loads with controls
- Location: tests\e2e\offline-online-verify.spec.ts:40:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/map", waiting until "load"

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
        - generic [ref=e31]:
          - generic [ref=e32]:
            - heading "Map" [level=1] [ref=e33]
            - paragraph [ref=e34]: Tennessee parks, trails, and routes. Previously viewed areas are available offline.
          - group "View mode" [ref=e35]:
            - button "Map" [pressed] [ref=e36] [cursor=pointer]:
              - generic [ref=e37]:
                - img [ref=e38]
                - text: Map
            - button "List" [ref=e40] [cursor=pointer]:
              - generic [ref=e41]:
                - img [ref=e42]
                - text: List
        - generic [ref=e44]:
          - button "Season Heatmap" [ref=e45] [cursor=pointer]:
            - img [ref=e46]
            - text: Season Heatmap
            - img [ref=e49]
          - button "Download map for offline use" [ref=e51] [cursor=pointer]:
            - img [ref=e52]
            - text: Download Map
        - region "Map view" [ref=e54]:
          - status "Loading map data" [ref=e55]:
            - paragraph [ref=e56]: Loading map data…
        - generic [ref=e59]:
          - heading "My Private Pins (0)" [level=3] [ref=e60]
          - button "+ Drop Pin" [ref=e61] [cursor=pointer]
    - contentinfo [ref=e62]:
      - link "Need help? Contact Support" [ref=e63] [cursor=pointer]:
        - /url: /support
        - img [ref=e64]
        - text: Need help? Contact Support
      - paragraph [ref=e66]: © 2026 ForageWise. All rights reserved.
  - navigation "Main navigation" [ref=e67]:
    - list [ref=e68]:
      - listitem [ref=e69]:
        - link "Field Guide" [ref=e70] [cursor=pointer]:
          - /url: /field-guide
          - img [ref=e71]
          - generic [ref=e73]: Field Guide
      - listitem [ref=e74]:
        - link "Map" [ref=e75] [cursor=pointer]:
          - /url: /map
          - img [ref=e76]
          - generic [ref=e78]: Map
      - listitem [ref=e79]:
        - link "ID" [ref=e80] [cursor=pointer]:
          - /url: /identify
          - img [ref=e81]
          - generic [ref=e83]: ID
      - listitem [ref=e84]:
        - link "Community" [ref=e85] [cursor=pointer]:
          - /url: /community
          - img [ref=e86]
          - generic [ref=e88]: Community
      - listitem [ref=e89]:
        - link "Plan" [ref=e90] [cursor=pointer]:
          - /url: /parks
          - img [ref=e91]
          - generic [ref=e93]: Plan
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
  32  |     await page.goto('/field-guide/sp-chanterelle');
  33  |     await page.waitForTimeout(5000);
  34  |     // Should show species name
  35  |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  36  |     // Should show habitat section
  37  |     await expect(page.getByText(/habitat/i)).toBeVisible();
  38  |   });
  39  | 
  40  |   test('map page loads with controls', async ({ page }) => {
> 41  |     await page.goto('/map');
      |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
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
  133 | 
  134 |     await context.setOffline(false);
  135 |   });
  136 | 
  137 |   test('map page renders offline', async ({ page, context }) => {
  138 |     await page.goto('/map');
  139 |     await page.waitForTimeout(4000);
  140 | 
  141 |     await context.setOffline(true);
```