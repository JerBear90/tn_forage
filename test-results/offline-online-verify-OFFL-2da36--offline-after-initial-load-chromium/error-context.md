# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-online-verify.spec.ts >> OFFLINE — Core Features Must Still Work >> field guide works offline after initial load
- Location: tests\e2e\offline-online-verify.spec.ts:101:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - link "Home" [ref=e3] [cursor=pointer]:
      - /url: /
      - img [ref=e4]
      - generic [ref=e6]: ForageWise
    - generic [ref=e7]:
      - button "Weather and online features" [ref=e8] [cursor=pointer]:
        - generic [ref=e9]: 🌤️
      - button "Open search" [ref=e10] [cursor=pointer]:
        - img [ref=e11]
      - link "Contact support" [ref=e14] [cursor=pointer]:
        - /url: mailto:studio7inquiry@gmail.com?subject=ForageWise%20Support
        - img [ref=e15]
      - button "Share ForageWise" [ref=e17] [cursor=pointer]:
        - img [ref=e18]
      - link "Profile" [ref=e20] [cursor=pointer]:
        - /url: /profile
        - img [ref=e22]
  - generic [ref=e24]:
    - alert [ref=e25]:
      - generic [ref=e26]:
        - img [ref=e27]
        - generic [ref=e29]:
          - heading "Important Safety Notice" [level=2] [ref=e30]
          - paragraph [ref=e31]:
            - text: ForageWise provides identification assistance only. Species results are
            - strong [ref=e32]: possible matches
            - text: ", not confirmations. Always"
            - strong [ref=e33]: verify with a qualified expert before consuming
            - text: any wild mushroom or plant.
      - button "I Understand" [active] [ref=e35] [cursor=pointer]
    - main [ref=e36]:
      - main [ref=e37]:
        - generic [ref=e38]:
          - heading "Field Guide" [level=1] [ref=e40]
          - paragraph [ref=e41]: Offline species reference for Tennessee mushrooms, plants, and trees.
          - generic [ref=e42]:
            - link "Spore Print Guide" [ref=e43] [cursor=pointer]:
              - /url: /field-guide/spore-print
              - img [ref=e44]
              - text: Spore Print
            - link "Compare species side by side" [ref=e46] [cursor=pointer]:
              - /url: /field-guide/compare
              - img [ref=e47]
              - text: Compare
            - link "Mushroom Calendar" [ref=e49] [cursor=pointer]:
              - /url: /mushroom-calendar
              - img [ref=e50]
              - text: Calendar
        - generic [ref=e52]:
          - generic [ref=e53]: Search species by common or scientific name
          - searchbox "Search species by common or scientific name" [ref=e54]
        - group "Category filters" [ref=e55]:
          - button "All" [pressed] [ref=e56] [cursor=pointer]
          - button "Mushroom" [ref=e57] [cursor=pointer]
          - button "Plant" [ref=e58] [cursor=pointer]
          - button "Tree" [ref=e59] [cursor=pointer]
        - group "Region filters" [ref=e60]:
          - button "All Regions" [pressed] [ref=e61] [cursor=pointer]
          - button "East TN" [ref=e62] [cursor=pointer]
          - button "Middle TN" [ref=e63] [cursor=pointer]
          - button "West TN" [ref=e64] [cursor=pointer]
        - button "Filters" [ref=e67] [cursor=pointer]:
          - img [ref=e68]
          - text: Filters
          - img [ref=e70]
        - status "Loading species data" [ref=e72]:
          - status "Loading species card" [ref=e73]:
            - generic [ref=e82]: Loading…
          - status "Loading species card" [ref=e83]:
            - generic [ref=e92]: Loading…
          - status "Loading species card" [ref=e93]:
            - generic [ref=e102]: Loading…
          - status "Loading species card" [ref=e103]:
            - generic [ref=e112]: Loading…
          - status "Loading species card" [ref=e113]:
            - generic [ref=e122]: Loading…
          - status "Loading species card" [ref=e123]:
            - generic [ref=e132]: Loading…
          - generic [ref=e133]: Loading species data…
    - contentinfo [ref=e134]:
      - link "Need help? Contact Support" [ref=e135] [cursor=pointer]:
        - /url: /support
        - img [ref=e136]
        - text: Need help? Contact Support
      - paragraph [ref=e138]: © 2026 ForageWise. All rights reserved.
    - dialog "Welcome tour" [ref=e139]:
      - generic [ref=e140]:
        - generic [ref=e148]:
          - generic [ref=e149]: 🍄
          - heading "Field Guide" [level=2] [ref=e150]
          - paragraph [ref=e151]: Browse 30+ mushroom, plant, and tree species with identification steps, season info, and safety warnings. Works offline.
        - generic [ref=e152]:
          - button "Skip tour" [ref=e153] [cursor=pointer]
          - button "Next" [ref=e154] [cursor=pointer]
  - navigation "Main navigation" [ref=e155]:
    - list [ref=e156]:
      - listitem [ref=e157]:
        - link "Field Guide" [ref=e158] [cursor=pointer]:
          - /url: /field-guide
          - img [ref=e159]
          - generic [ref=e161]: Field Guide
      - listitem [ref=e162]:
        - link "Map" [ref=e163] [cursor=pointer]:
          - /url: /map
          - img [ref=e164]
          - generic [ref=e166]: Map
      - listitem [ref=e167]:
        - link "ID" [ref=e168] [cursor=pointer]:
          - /url: /identify
          - img [ref=e169]
          - generic [ref=e171]: ID
      - listitem [ref=e172]:
        - link "Community" [ref=e173] [cursor=pointer]:
          - /url: /community
          - img [ref=e174]
          - generic [ref=e176]: Community
      - listitem [ref=e177]:
        - link "Plan" [ref=e178] [cursor=pointer]:
          - /url: /parks
          - img [ref=e179]
          - generic [ref=e181]: Plan
  - alert [ref=e182]
```

# Test source

```ts
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
> 108 |     expect(await cardsOnline.count()).toBeGreaterThan(0);
      |                                       ^ Error: expect(received).toBeGreaterThan(expected)
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
  142 |     await page.reload();
  143 |     await page.waitForTimeout(3000);
  144 | 
  145 |     // Map heading should still be visible
  146 |     await expect(page.getByRole('heading', { name: /map/i })).toBeVisible();
  147 | 
  148 |     await context.setOffline(false);
  149 |   });
  150 | 
  151 |   test('trips page works offline', async ({ page, context }) => {
  152 |     await page.goto('/trips');
  153 |     await page.waitForTimeout(3000);
  154 | 
  155 |     await context.setOffline(true);
  156 |     await page.reload();
  157 |     await page.waitForTimeout(2000);
  158 | 
  159 |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  160 | 
  161 |     await context.setOffline(false);
  162 |   });
  163 | 
  164 |   test('survival toolkit works offline', async ({ page, context }) => {
  165 |     await page.goto('/survival');
  166 |     await page.waitForTimeout(2000);
  167 | 
  168 |     await context.setOffline(true);
  169 |     await page.reload();
  170 |     await page.waitForTimeout(2000);
  171 | 
  172 |     // Emergency reference should work without internet
  173 |     await expect(page.getByText(/never eat/i)).toBeVisible();
  174 | 
  175 |     await context.setOffline(false);
  176 |   });
  177 | 
  178 |   test('profile page works offline', async ({ page, context }) => {
  179 |     await page.goto('/profile');
  180 |     await page.waitForTimeout(2000);
  181 | 
  182 |     await context.setOffline(true);
  183 |     await page.reload();
  184 |     await page.waitForTimeout(2000);
  185 | 
  186 |     await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
  187 | 
  188 |     await context.setOffline(false);
  189 |   });
  190 | 
  191 |   test('quick capture button visible offline', async ({ page, context }) => {
  192 |     await page.goto('/');
  193 |     await page.waitForTimeout(3000);
  194 | 
  195 |     await context.setOffline(true);
  196 |     await page.reload();
  197 |     await page.waitForTimeout(2000);
  198 | 
  199 |     // QuickCapture should still be accessible offline
  200 |     await expect(page.getByRole('button', { name: /quick capture/i })).toBeVisible();
  201 | 
  202 |     await context.setOffline(false);
  203 |   });
  204 | 
  205 |   test('bottom nav works offline', async ({ page, context }) => {
  206 |     await page.goto('/');
  207 |     await page.waitForTimeout(2000);
  208 | 
```