# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-online-verify.spec.ts >> ONLINE — Core Features >> profile page loads
- Location: tests\e2e\offline-online-verify.spec.ts:59:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/species/i)
Expected: visible
Error: strict mode violation: getByText(/species/i) resolved to 3 elements:
    1) <p class="mt-1.5 text-sm leading-relaxed text-brand-charcoal/85 dark:text-brand-sand/85">…</p> aka getByText('ForageWise provides')
    2) <p class="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">Species reference library</p> aka getByRole('link', { name: 'Field Guide Species reference' })
    3) <p class="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">Emergency reference, toxic species, GPS coordinat…</p> aka getByRole('link', { name: 'Survival Toolkit Emergency' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/species/i)

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
          - heading "Profile" [level=1] [ref=e49]
          - paragraph [ref=e50]: Your account, settings, and activity.
        - region "Profile info" [ref=e51]:
          - generic [ref=e52]:
            - img [ref=e55]
            - generic [ref=e57]:
              - paragraph [ref=e59]: Not signed in
              - generic [ref=e60]:
                - generic [ref=e61]: Guest
                - generic [ref=e62]: Free plan
              - link "Sign in →" [ref=e63] [cursor=pointer]:
                - /url: /login
          - generic [ref=e64]:
            - paragraph [ref=e65]: Update avatar
            - generic [ref=e66]:
              - button "Camera" [ref=e67] [cursor=pointer]:
                - img [ref=e68]
                - text: Camera
              - button "Gallery" [ref=e71] [cursor=pointer]:
                - img [ref=e72]
                - text: Gallery
        - generic [ref=e76]:
          - generic [ref=e79]: NS
          - generic [ref=e80]:
            - heading "Not signed in" [level=2] [ref=e81]
            - generic [ref=e82]:
              - generic [ref=e83]: 0 followers
              - generic [ref=e84]: 0 following
        - generic [ref=e86]:
          - generic [ref=e87]:
            - paragraph [ref=e88]: "0"
            - paragraph [ref=e89]: Species
          - generic [ref=e91]:
            - paragraph [ref=e92]: "0"
            - paragraph [ref=e93]: Observations
          - link "+ Log a find" [ref=e95] [cursor=pointer]:
            - /url: /expedition
        - generic [ref=e97]:
          - tablist "Profile sections" [ref=e98]:
            - tab "Completed Trips" [selected] [ref=e99] [cursor=pointer]
            - tab "Achievements" [ref=e100] [cursor=pointer]
            - tab "Reviews" [ref=e101] [cursor=pointer]
            - tab "Photos" [ref=e102] [cursor=pointer]
          - tabpanel "Completed Trips" [ref=e104]:
            - paragraph [ref=e105]: No completed trips yet.
        - generic [ref=e106]:
          - heading "My Finds" [level=2] [ref=e107]
          - generic [ref=e108]:
            - generic [ref=e109]: 🍄
            - paragraph [ref=e110]: No finds yet. Start logging your discoveries in the Expedition Log!
            - link "Go to Expedition Log →" [ref=e111] [cursor=pointer]:
              - /url: /expedition
        - region "Quick links" [ref=e112]:
          - heading "Activity" [level=2] [ref=e113]
          - link "My Trips View and manage saved trips" [ref=e114] [cursor=pointer]:
            - /url: /trips
            - generic [ref=e115]: 🗺️
            - generic [ref=e116]:
              - paragraph [ref=e117]: My Trips
              - paragraph [ref=e118]: View and manage saved trips
            - img [ref=e119]
          - link "Expedition Logs Browse your field observations" [ref=e121] [cursor=pointer]:
            - /url: /expedition
            - generic [ref=e122]: 📷
            - generic [ref=e123]:
              - paragraph [ref=e124]: Expedition Logs
              - paragraph [ref=e125]: Browse your field observations
            - img [ref=e126]
          - link "Field Guide Species reference library" [ref=e128] [cursor=pointer]:
            - /url: /field-guide
            - generic [ref=e129]: 📖
            - generic [ref=e130]:
              - paragraph [ref=e131]: Field Guide
              - paragraph [ref=e132]: Species reference library
            - img [ref=e133]
        - region "Support" [ref=e135]:
          - heading "Tools & Support" [level=2] [ref=e136]
          - link "Survival Toolkit Emergency reference, toxic species, GPS coordinates" [ref=e137] [cursor=pointer]:
            - /url: /survival
            - generic [ref=e138]: 🆘
            - generic [ref=e139]:
              - paragraph [ref=e140]: Survival Toolkit
              - paragraph [ref=e141]: Emergency reference, toxic species, GPS coordinates
            - img [ref=e142]
          - link "Get Help Report a problem or request assistance" [ref=e144] [cursor=pointer]:
            - /url: /support
            - generic [ref=e145]: 🛟
            - generic [ref=e146]:
              - paragraph [ref=e147]: Get Help
              - paragraph [ref=e148]: Report a problem or request assistance
            - img [ref=e149]
        - region "Settings" [ref=e151]:
          - heading "Settings" [level=2] [ref=e152]
          - generic [ref=e153]:
            - generic [ref=e154]:
              - paragraph [ref=e155]: Dark Mode
              - paragraph [ref=e156]: Toggle light and dark themes
            - switch "Toggle dark mode" [ref=e157] [cursor=pointer]
          - generic [ref=e159]:
            - generic [ref=e160]:
              - paragraph [ref=e161]: Membership
              - paragraph [ref=e162]: Free plan
            - generic [ref=e163]: Free
        - paragraph [ref=e164]: Profile data is cached locally for offline access.
    - contentinfo [ref=e165]:
      - link "Need help? Contact Support" [ref=e166] [cursor=pointer]:
        - /url: /support
        - img [ref=e167]
        - text: Need help? Contact Support
      - paragraph [ref=e169]: © 2026 ForageWise. All rights reserved.
  - navigation "Main navigation" [ref=e170]:
    - list [ref=e171]:
      - listitem [ref=e172]:
        - link "Field Guide" [ref=e173] [cursor=pointer]:
          - /url: /field-guide
          - img [ref=e174]
          - generic [ref=e176]: Field Guide
      - listitem [ref=e177]:
        - link "Map" [ref=e178] [cursor=pointer]:
          - /url: /map
          - img [ref=e179]
          - generic [ref=e181]: Map
      - listitem [ref=e182]:
        - link "ID" [ref=e183] [cursor=pointer]:
          - /url: /identify
          - img [ref=e184]
          - generic [ref=e186]: ID
      - listitem [ref=e187]:
        - link "Community" [ref=e188] [cursor=pointer]:
          - /url: /community
          - img [ref=e189]
          - generic [ref=e191]: Community
      - listitem [ref=e192]:
        - link "Plan" [ref=e193] [cursor=pointer]:
          - /url: /parks
          - img [ref=e194]
          - generic [ref=e196]: Plan
  - alert [ref=e197]
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
> 63  |     await expect(page.getByText(/species/i)).toBeVisible();
      |                                              ^ Error: expect(locator).toBeVisible() failed
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
```