# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-online-verify.spec.ts >> ONLINE — Core Features >> survival toolkit page loads
- Location: tests\e2e\offline-online-verify.spec.ts:66:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /survival/i })
Expected: visible
Error: strict mode violation: getByRole('heading', { name: /survival/i }) resolved to 2 elements:
    1) <h1 class="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">Survival Toolkit</h1> aka getByRole('heading', { name: 'Survival Toolkit' })
    2) <h2 class="font-heading font-semibold text-sm text-red-800 dark:text-red-300 flex items-center gap-2">…</h2> aka getByRole('heading', { name: 'Survival Quick Reference' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /survival/i })

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
  - generic:
    - img
    - paragraph: ForageWise
  - banner [ref=e11]:
    - link "Home" [ref=e12] [cursor=pointer]:
      - /url: /
      - img [ref=e13]
      - generic [ref=e15]: ForageWise
    - generic [ref=e16]:
      - button "Weather and online features" [ref=e17] [cursor=pointer]:
        - generic [ref=e18]: 🌤️
      - button "Open search" [ref=e19] [cursor=pointer]:
        - img [ref=e20]
      - link "Contact support" [ref=e23] [cursor=pointer]:
        - /url: mailto:studio7inquiry@gmail.com?subject=ForageWise%20Support
        - img [ref=e24]
      - button "Share ForageWise" [ref=e26] [cursor=pointer]:
        - img [ref=e27]
      - link "Profile" [ref=e29] [cursor=pointer]:
        - /url: /profile
        - img [ref=e31]
  - generic [ref=e33]:
    - alert [ref=e34]:
      - generic [ref=e35]:
        - img [ref=e36]
        - generic [ref=e38]:
          - heading "Important Safety Notice" [level=2] [ref=e39]
          - paragraph [ref=e40]:
            - text: ForageWise provides identification assistance only. Species results are
            - strong [ref=e41]: possible matches
            - text: ", not confirmations. Always"
            - strong [ref=e42]: verify with a qualified expert before consuming
            - text: any wild mushroom or plant.
      - button "I Understand" [active] [ref=e44] [cursor=pointer]
    - main [ref=e45]:
      - main [ref=e46]:
        - generic [ref=e47]:
          - link "← Home" [ref=e48] [cursor=pointer]:
            - /url: /
          - heading "Survival Toolkit" [level=1] [ref=e49]
          - paragraph [ref=e50]: Emergency field reference. Works offline. Not a substitute for training.
        - generic [ref=e51]:
          - generic [ref=e52]:
            - heading "Survival Quick Reference" [level=2] [ref=e53]:
              - generic [ref=e54]: 🆘
              - text: Survival Quick Reference
            - paragraph [ref=e55]: Emergency field reference. Works offline. NOT a substitute for training.
          - generic [ref=e56]:
            - button "☠️ Never Eat" [ref=e57] [cursor=pointer]
            - button "💧 Find Water" [ref=e58] [cursor=pointer]
            - button "📞 Emergency" [ref=e59] [cursor=pointer]
          - generic [ref=e61]:
            - paragraph [ref=e62]: ⚠️ NEVER consume these species. All are potentially fatal.
            - link "☠️ Destroying Angel Fatal. No antidote. Looks like common edible mushrooms." [ref=e63] [cursor=pointer]:
              - /url: /field-guide/sp-destroying-angel
              - generic [ref=e64]: ☠️
              - generic [ref=e65]:
                - paragraph [ref=e66]: Destroying Angel
                - paragraph [ref=e67]: Fatal. No antidote. Looks like common edible mushrooms.
            - link "☠️ Death Cap Responsible for most mushroom fatalities worldwide." [ref=e68] [cursor=pointer]:
              - /url: /field-guide/sp-death-cap
              - generic [ref=e69]: ☠️
              - generic [ref=e70]:
                - paragraph [ref=e71]: Death Cap
                - paragraph [ref=e72]: Responsible for most mushroom fatalities worldwide.
            - link "☠️ Deadly Galerina Grows on wood. Easily confused with Honey Mushroom." [ref=e73] [cursor=pointer]:
              - /url: /field-guide/sp-deadly-galerina
              - generic [ref=e74]: ☠️
              - generic [ref=e75]:
                - paragraph [ref=e76]: Deadly Galerina
                - paragraph [ref=e77]: Grows on wood. Easily confused with Honey Mushroom.
            - link "☠️ False Morel Brain-shaped cap. Contains hydrazine toxins." [ref=e78] [cursor=pointer]:
              - /url: /field-guide/sp-false-morel
              - generic [ref=e79]: ☠️
              - generic [ref=e80]:
                - paragraph [ref=e81]: False Morel
                - paragraph [ref=e82]: Brain-shaped cap. Contains hydrazine toxins.
            - link "☠️ Jack O'Lantern Looks like Chanterelle. Causes severe GI distress." [ref=e83] [cursor=pointer]:
              - /url: /field-guide/sp-jack-o-lantern
              - generic [ref=e84]: ☠️
              - generic [ref=e85]:
                - paragraph [ref=e86]: Jack O'Lantern
                - paragraph [ref=e87]: Looks like Chanterelle. Causes severe GI distress.
            - link "☠️ Poison Hemlock Fatal. All parts toxic. Looks like wild carrot." [ref=e88] [cursor=pointer]:
              - /url: /field-guide/pl-poison-hemlock
              - generic [ref=e89]: ☠️
              - generic [ref=e90]:
                - paragraph [ref=e91]: Poison Hemlock
                - paragraph [ref=e92]: Fatal. All parts toxic. Looks like wild carrot.
        - generic [ref=e93]:
          - heading "Quick Document" [level=2] [ref=e94]
          - generic [ref=e95]:
            - button "Quick capture — take a photo" [ref=e96] [cursor=pointer]:
              - img [ref=e97]
              - text: Quick Capture
            - paragraph [ref=e100]: One tap. Auto-saves photo + GPS + time. ID later.
    - contentinfo [ref=e101]:
      - link "Need help? Contact Support" [ref=e102] [cursor=pointer]:
        - /url: /support
        - img [ref=e103]
        - text: Need help? Contact Support
      - paragraph [ref=e105]: © 2026 ForageWise. All rights reserved.
  - navigation "Main navigation" [ref=e106]:
    - list [ref=e107]:
      - listitem [ref=e108]:
        - link "Field Guide" [ref=e109] [cursor=pointer]:
          - /url: /field-guide
          - img [ref=e110]
          - generic [ref=e112]: Field Guide
      - listitem [ref=e113]:
        - link "Map" [ref=e114] [cursor=pointer]:
          - /url: /map
          - img [ref=e115]
          - generic [ref=e117]: Map
      - listitem [ref=e118]:
        - link "ID" [ref=e119] [cursor=pointer]:
          - /url: /identify
          - img [ref=e120]
          - generic [ref=e122]: ID
      - listitem [ref=e123]:
        - link "Community" [ref=e124] [cursor=pointer]:
          - /url: /community
          - img [ref=e125]
          - generic [ref=e127]: Community
      - listitem [ref=e128]:
        - link "Plan" [ref=e129] [cursor=pointer]:
          - /url: /parks
          - img [ref=e130]
          - generic [ref=e132]: Plan
  - alert [ref=e133]
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
> 68  |     await expect(page.getByRole('heading', { name: /survival/i })).toBeVisible();
      |                                                                    ^ Error: expect(locator).toBeVisible() failed
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
```