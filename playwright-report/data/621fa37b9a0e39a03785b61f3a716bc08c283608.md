# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-online-verify.spec.ts >> ONLINE — Core Features >> field guide loads species from IndexedDB
- Location: tests\e2e\offline-online-verify.spec.ts:24:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForTimeout: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - dialog "ForageWise welcome animation" [ref=e2]:
    - generic [ref=e3]:
      - img [ref=e4]
      - img [ref=e5]
    - paragraph [ref=e8]: ForageWise
    - paragraph [ref=e9]: Discover Tennessee's wild side
    - button "Skip intro animation" [ref=e10] [cursor=pointer]: Skip
  - generic [ref=e11]:
    - img [ref=e12]
    - paragraph [ref=e13]: ForageWise
  - banner [ref=e14]:
    - link "Home" [ref=e15] [cursor=pointer]:
      - /url: /
      - img [ref=e16]
      - generic [ref=e18]: ForageWise
    - generic [ref=e19]:
      - button "Weather and online features" [ref=e20] [cursor=pointer]:
        - generic [ref=e21]: 🌤️
      - button "Open search" [ref=e22] [cursor=pointer]:
        - img [ref=e23]
      - link "Contact support" [ref=e26] [cursor=pointer]:
        - /url: mailto:studio7inquiry@gmail.com?subject=ForageWise%20Support
        - img [ref=e27]
      - button "Share ForageWise" [ref=e29] [cursor=pointer]:
        - img [ref=e30]
      - link "Profile" [ref=e32] [cursor=pointer]:
        - /url: /profile
        - img [ref=e34]
  - generic [ref=e36]:
    - alert [ref=e37]:
      - generic [ref=e38]:
        - img [ref=e39]
        - generic [ref=e41]:
          - heading "Important Safety Notice" [level=2] [ref=e42]
          - paragraph [ref=e43]:
            - text: ForageWise provides identification assistance only. Species results are
            - strong [ref=e44]: possible matches
            - text: ", not confirmations. Always"
            - strong [ref=e45]: verify with a qualified expert before consuming
            - text: any wild mushroom or plant.
      - button "I Understand" [active] [ref=e47] [cursor=pointer]
    - main [ref=e48]:
      - main [ref=e49]:
        - generic [ref=e50]:
          - heading "Field Guide" [level=1] [ref=e52]
          - paragraph [ref=e53]: Offline species reference for Tennessee mushrooms, plants, and trees.
          - generic [ref=e54]:
            - link "Spore Print Guide" [ref=e55] [cursor=pointer]:
              - /url: /field-guide/spore-print
              - img [ref=e56]
              - text: Spore Print
            - link "Compare species side by side" [ref=e58] [cursor=pointer]:
              - /url: /field-guide/compare
              - img [ref=e59]
              - text: Compare
            - link "Mushroom Calendar" [ref=e61] [cursor=pointer]:
              - /url: /mushroom-calendar
              - img [ref=e62]
              - text: Calendar
        - generic [ref=e64]:
          - generic [ref=e65]: Search species by common or scientific name
          - searchbox "Search species by common or scientific name" [ref=e66]
        - group "Category filters" [ref=e67]:
          - button "All" [pressed] [ref=e68] [cursor=pointer]
          - button "Mushroom" [ref=e69] [cursor=pointer]
          - button "Plant" [ref=e70] [cursor=pointer]
          - button "Tree" [ref=e71] [cursor=pointer]
        - group "Region filters" [ref=e72]:
          - button "All Regions" [pressed] [ref=e73] [cursor=pointer]
          - button "East TN" [ref=e74] [cursor=pointer]
          - button "Middle TN" [ref=e75] [cursor=pointer]
          - button "West TN" [ref=e76] [cursor=pointer]
        - button "Filters" [ref=e79] [cursor=pointer]:
          - img [ref=e80]
          - text: Filters
          - img [ref=e82]
        - status "Loading species data" [ref=e84]:
          - status "Loading species card" [ref=e85]:
            - generic [ref=e94]: Loading…
          - status "Loading species card" [ref=e95]:
            - generic [ref=e104]: Loading…
          - status "Loading species card" [ref=e105]:
            - generic [ref=e114]: Loading…
          - status "Loading species card" [ref=e115]:
            - generic [ref=e124]: Loading…
          - status "Loading species card" [ref=e125]:
            - generic [ref=e134]: Loading…
          - status "Loading species card" [ref=e135]:
            - generic [ref=e144]: Loading…
          - generic [ref=e145]: Loading species data…
    - contentinfo [ref=e146]:
      - link "Need help? Contact Support" [ref=e147] [cursor=pointer]:
        - /url: /support
        - img [ref=e148]
        - text: Need help? Contact Support
      - paragraph [ref=e150]: © 2026 ForageWise. All rights reserved.
  - navigation "Main navigation" [ref=e151]:
    - list [ref=e152]:
      - listitem [ref=e153]:
        - link "Field Guide" [ref=e154] [cursor=pointer]:
          - /url: /field-guide
          - img [ref=e155]
          - generic [ref=e157]: Field Guide
      - listitem [ref=e158]:
        - link "Map" [ref=e159] [cursor=pointer]:
          - /url: /map
          - img [ref=e160]
          - generic [ref=e162]: Map
      - listitem [ref=e163]:
        - link "ID" [ref=e164] [cursor=pointer]:
          - /url: /identify
          - img [ref=e165]
          - generic [ref=e167]: ID
      - listitem [ref=e168]:
        - link "Community" [ref=e169] [cursor=pointer]:
          - /url: /community
          - img [ref=e170]
          - generic [ref=e172]: Community
      - listitem [ref=e173]:
        - link "Plan" [ref=e174] [cursor=pointer]:
          - /url: /parks
          - img [ref=e175]
          - generic [ref=e177]: Plan
  - alert [ref=e178]
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
> 26  |     await page.waitForTimeout(5000); // Wait for IndexedDB seed
      |                ^ Error: page.waitForTimeout: Test timeout of 30000ms exceeded.
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
```