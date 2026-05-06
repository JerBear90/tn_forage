# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-online-verify.spec.ts >> ONLINE — Core Features >> weather panel opens on tap
- Location: tests\e2e\offline-online-verify.spec.ts:78:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /weather/i })
    - locator resolved to <button type="button" aria-label="Weather and online features" class="text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70 tabular-nums flex items-center gap-0.5 rounded-md px-1.5 py-1 hover:bg-brand-teal/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div role="dialog" aria-label="Welcome tour" class="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center bg-black/50 px-4 pb-24 sm:pb-4">…</div> from <div class="pt-12">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div role="dialog" aria-label="Welcome tour" class="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center bg-black/50 px-4 pb-24 sm:pb-4">…</div> from <div class="pt-12">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    32 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div role="dialog" aria-label="Welcome tour" class="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center bg-black/50 px-4 pb-24 sm:pb-4">…</div> from <div class="pt-12">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed

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
          - heading "ForageWise ForageWise" [level=1] [ref=e39]:
            - img "ForageWise" [ref=e40]
            - generic [ref=e41]: ForageWise
          - paragraph [ref=e42]: Mushroom, plant & trail discovery in Tennessee
        - generic [ref=e43]:
          - heading "What's Around Me Now?" [level=2] [ref=e44]
          - button "Enable location to see what's in season near you" [ref=e45] [cursor=pointer]:
            - img [ref=e46]
            - text: Enable location to see what's in season near you
        - generic [ref=e50]:
          - button "Quick capture — take a photo" [ref=e51] [cursor=pointer]:
            - img [ref=e52]
            - text: Quick Capture
          - paragraph [ref=e55]: One tap. Auto-saves photo + GPS + time. ID later.
        - button "Customize homepage layout" [ref=e57] [cursor=pointer]:
          - img [ref=e58]
          - generic [ref=e61]: Customize
        - region "Seasonal highlights" [ref=e63]:
          - heading "Spring Highlights" [level=2] [ref=e64]
          - generic [ref=e65]:
            - link "View Chaga" [ref=e66] [cursor=pointer]:
              - /url: /field-guide/sp-chaga
              - img "Chaga" [ref=e68]
              - generic [ref=e69]:
                - paragraph [ref=e70]: Chaga
                - paragraph [ref=e71]: Found on living birch trees as a dark, charcoal-like mass protruding from the trunk. Parasitic on birch. Occasionally found on other hardwoods.
                - generic [ref=e72]: Spring, Summer, Fall, Winter
            - link "View Chicory" [ref=e73] [cursor=pointer]:
              - /url: /field-guide/pl-chicory
              - img "Chicory" [ref=e75]
              - generic [ref=e76]:
                - paragraph [ref=e77]: Chicory
                - paragraph [ref=e78]: Found along roadsides, field edges, waste areas, and disturbed ground. Thrives in poor, compacted soils and full sun. Very common throughout Tennessee.
                - generic [ref=e79]: Spring, Summer, Fall
            - link "View Common Blue Violet" [ref=e80] [cursor=pointer]:
              - /url: /field-guide/pl-wild-violet
              - img "Common Blue Violet" [ref=e82]
              - generic [ref=e83]:
                - paragraph [ref=e84]: Common Blue Violet
                - paragraph [ref=e85]: Found in lawns, meadows, forest edges, and moist woodlands. Tolerates sun to partial shade. One of the most common wildflowers in Tennessee.
                - generic [ref=e86]: Spring
            - link "View Deadly Galerina" [ref=e87] [cursor=pointer]:
              - /url: /field-guide/sp-deadly-galerina
              - img "Deadly Galerina" [ref=e89]
              - generic [ref=e90]:
                - paragraph [ref=e91]: Deadly Galerina
                - paragraph [ref=e92]: Found on decaying hardwood and conifer logs, stumps, and wood chips. Grows singly or in small clusters. Common in moist forests.
                - generic [ref=e93]: Spring, Summer, Fall
            - link "View Dryad's Saddle / Pheasant Back" [ref=e94] [cursor=pointer]:
              - /url: /field-guide/sp-dryads-saddle
              - img "Dryad's Saddle / Pheasant Back" [ref=e96]
              - generic [ref=e97]:
                - paragraph [ref=e98]: Dryad's Saddle / Pheasant Back
                - paragraph [ref=e99]: Found on dead or dying hardwood trees, especially elms, maples, and box elders. Grows as large, semicircular brackets on trunks and stumps.
                - generic [ref=e100]: Spring, Summer
            - link "View False Morel" [ref=e101] [cursor=pointer]:
              - /url: /field-guide/sp-false-morel
              - img "False Morel" [ref=e103]
              - generic [ref=e104]:
                - paragraph [ref=e105]: False Morel
                - paragraph [ref=e106]: Found on the ground in coniferous and mixed forests, sandy soils, and disturbed areas. Often appears in spring around the same time as true morels.
                - generic [ref=e107]: Spring
            - link "View Mayapple" [ref=e108] [cursor=pointer]:
              - /url: /field-guide/pl-mayapple
              - img "Mayapple" [ref=e110]
              - generic [ref=e111]:
                - paragraph [ref=e112]: Mayapple
                - paragraph [ref=e113]: Found in rich, moist deciduous forests, often forming large colonies on the forest floor. Prefers partial shade and deep leaf litter. Common throughout Tennessee.
                - generic [ref=e114]: Spring, Summer
            - link "View Morel" [ref=e115] [cursor=pointer]:
              - /url: /field-guide/sp-morel
              - img "Morel" [ref=e117]
              - generic [ref=e118]:
                - paragraph [ref=e119]: Morel
                - paragraph [ref=e120]: Found on the ground in hardwood forests, old orchards, burned areas, and disturbed soils. Often near tulip poplars, ash, and elms.
                - generic [ref=e121]: Spring
            - link "View Oyster Mushroom" [ref=e122] [cursor=pointer]:
              - /url: /field-guide/sp-oyster-mushroom
              - img "Oyster Mushroom" [ref=e124]
              - generic [ref=e125]:
                - paragraph [ref=e126]: Oyster Mushroom
                - paragraph [ref=e127]: Found on dead or dying hardwood trees, logs, and stumps. Grows in shelf-like clusters. Common on beech, poplar, and oak.
                - generic [ref=e128]: Fall, Winter, Spring
            - link "View Poison Hemlock" [ref=e129] [cursor=pointer]:
              - /url: /field-guide/pl-poison-hemlock
              - img "Poison Hemlock" [ref=e131]
              - generic [ref=e132]:
                - paragraph [ref=e133]: Poison Hemlock
                - paragraph [ref=e134]: Found along roadsides, ditches, stream banks, field edges, and waste areas. Prefers moist, disturbed soils. Increasingly common throughout Tennessee.
                - generic [ref=e135]: Spring, Summer
            - link "View Poison Ivy" [ref=e136] [cursor=pointer]:
              - /url: /field-guide/pl-poison-ivy
              - img "Poison Ivy" [ref=e138]
              - generic [ref=e139]:
                - paragraph [ref=e140]: Poison Ivy
                - paragraph [ref=e141]: Found in forests, forest edges, roadsides, fence rows, and disturbed areas. Grows as a vine, shrub, or ground cover. Extremely common throughout Tennessee.
                - generic [ref=e142]: Spring, Summer, Fall
            - link "View Pokeweed" [ref=e143] [cursor=pointer]:
              - /url: /field-guide/pl-pokeweed
              - img "Pokeweed" [ref=e145]
              - generic [ref=e146]:
                - paragraph [ref=e147]: Pokeweed
                - paragraph [ref=e148]: Found in disturbed areas, roadsides, field edges, fence rows, and open woodlands. Thrives in rich, moist soils. Very common throughout Tennessee.
                - generic [ref=e149]: Spring, Summer, Fall
            - link "View Ramps" [ref=e150] [cursor=pointer]:
              - /url: /field-guide/pl-ramps
              - img "Ramps" [ref=e152]
              - generic [ref=e153]:
                - paragraph [ref=e154]: Ramps
                - paragraph [ref=e155]: Found in rich, moist deciduous forests, often in coves and along streams. Prefers shaded slopes with deep leaf litter. Grows in dense colonies.
                - generic [ref=e156]: Spring
            - link "View Shaggy Mane" [ref=e157] [cursor=pointer]:
              - /url: /field-guide/sp-shaggy-mane
              - img "Shaggy Mane" [ref=e159]
              - generic [ref=e160]:
                - paragraph [ref=e161]: Shaggy Mane
                - paragraph [ref=e162]: Found in lawns, meadows, gravel paths, disturbed soils, and along roadsides. Often appears after rain in urban and suburban areas.
                - generic [ref=e163]: Spring, Summer, Fall
            - link "View Spicebush" [ref=e164] [cursor=pointer]:
              - /url: /field-guide/pl-spicebush
              - img "Spicebush" [ref=e166]
              - generic [ref=e167]:
                - paragraph [ref=e168]: Spicebush
                - paragraph [ref=e169]: Found in moist, rich forests, along streams, and in bottomlands. Grows as an understory shrub in partial to full shade. Common throughout Tennessee.
                - generic [ref=e170]: Spring, Summer, Fall
            - link "View Stinging Nettle" [ref=e171] [cursor=pointer]:
              - /url: /field-guide/pl-stinging-nettle
              - img "Stinging Nettle" [ref=e173]
              - generic [ref=e174]:
                - paragraph [ref=e175]: Stinging Nettle
                - paragraph [ref=e176]: Found in moist, rich soils along streams, forest edges, disturbed areas, and old homesteads. Often grows in dense patches. Common in East and Middle Tennessee.
                - generic [ref=e177]: Spring, Summer
            - link "View Turkey Tail" [ref=e178] [cursor=pointer]:
              - /url: /field-guide/sp-turkey-tail
              - img "Turkey Tail" [ref=e180]
              - generic [ref=e181]:
                - paragraph [ref=e182]: Turkey Tail
                - paragraph [ref=e183]: Found on dead hardwood logs, stumps, and fallen branches. One of the most common woodland fungi. Grows in overlapping rows or rosettes.
                - generic [ref=e184]: Spring, Summer, Fall, Winter
            - link "View Violet-Toothed Polypore" [ref=e185] [cursor=pointer]:
              - /url: /field-guide/sp-violet-toothed-polypore
              - img "Violet-Toothed Polypore" [ref=e187]
              - generic [ref=e188]:
                - paragraph [ref=e189]: Violet-Toothed Polypore
                - paragraph [ref=e190]: Found on dead hardwood logs, stumps, and fallen branches. One of the most common polypores in eastern North American forests.
                - generic [ref=e191]: Spring, Summer, Fall, Winter
            - link "View Virginia Creeper" [ref=e192] [cursor=pointer]:
              - /url: /field-guide/pl-virginia-creeper
              - img "Virginia Creeper" [ref=e194]
              - generic [ref=e195]:
                - paragraph [ref=e196]: Virginia Creeper
                - paragraph [ref=e197]: Found in forests, forest edges, fence rows, and climbing on trees and structures. Grows as a woody vine or ground cover. Extremely common throughout Tennessee.
                - generic [ref=e198]: Spring, Summer, Fall
            - link "View Wild Ginger" [ref=e199] [cursor=pointer]:
              - /url: /field-guide/pl-wild-ginger
              - img "Wild Ginger" [ref=e201]
              - generic [ref=e202]:
                - paragraph [ref=e203]: Wild Ginger
                - paragraph [ref=e204]: Found in rich, moist deciduous forests, often on shaded slopes and along streams. Grows as a low ground cover in colonies. Prefers deep leaf litter and humus-rich soil.
                - generic [ref=e205]: Spring, Summer
            - link "View Witch's Butter" [ref=e206] [cursor=pointer]:
              - /url: /field-guide/sp-witchs-butter
              - img "Witch's Butter" [ref=e208]
              - generic [ref=e209]:
                - paragraph [ref=e210]: Witch's Butter
                - paragraph [ref=e211]: Found on dead hardwood branches and sticks, especially oaks. A jelly fungus that is actually parasitic on other fungi growing within the wood.
                - generic [ref=e212]: Fall, Winter, Spring
            - link "View Wood Ear" [ref=e213] [cursor=pointer]:
              - /url: /field-guide/sp-wood-ear
              - img "Wood Ear" [ref=e215]
              - generic [ref=e216]:
                - paragraph [ref=e217]: Wood Ear
                - paragraph [ref=e218]: Found on dead or dying hardwood trees and branches, especially elder and beech. A jelly fungus that grows in clusters on decaying wood.
                - generic [ref=e219]: Spring, Summer, Fall
        - region "Community feed preview" [ref=e221]:
          - generic [ref=e222]:
            - heading "Community Sightings" [level=2] [ref=e223]
            - link "View all →" [ref=e224] [cursor=pointer]:
              - /url: /community
          - generic [ref=e225]:
            - paragraph [ref=e226]: No public sightings yet. Be the first to share!
            - link "Go to Community →" [ref=e227] [cursor=pointer]:
              - /url: /community
        - region "Challenges" [ref=e229]:
          - heading "Active Challenges" [level=2] [ref=e230]
          - generic [ref=e231]:
            - 'link "View challenge: Tennessee Wild Edible Plants" [ref=e232] [cursor=pointer]':
              - /url: /community#challenges
              - article [ref=e233]:
                - generic [ref=e235]:
                  - generic [ref=e236]:
                    - heading "Tennessee Wild Edible Plants" [level=3] [ref=e237]
                    - generic [ref=e238]: Foraging
                  - paragraph [ref=e239]: Discover wild edible plants native to Tennessee. Always verify with a qualified expert before consuming any wild species.
                - generic [ref=e240]:
                  - generic [ref=e241]:
                    - generic [ref=e242]: Progress
                    - generic [ref=e243]: 0 / 5
                  - progressbar "0 of 5 criteria completed" [ref=e244]
                - list "Challenge criteria" [ref=e245]:
                  - listitem [ref=e246]:
                    - generic [ref=e247]:
                      - checkbox "Identify wild ramps (Allium tricoccum) in East TN" [ref=e249]
                      - generic [ref=e250]: Identify wild ramps (Allium tricoccum) in East TN
                  - listitem [ref=e251]:
                    - generic [ref=e252]:
                      - checkbox "Document pawpaw fruit on a foraging trip" [ref=e254]
                      - generic [ref=e255]: Document pawpaw fruit on a foraging trip
                  - listitem [ref=e256]:
                    - generic [ref=e257]:
                      - checkbox "Find and photograph wild blackberries along a trail" [ref=e259]
                      - generic [ref=e260]: Find and photograph wild blackberries along a trail
                  - listitem [ref=e261]:
                    - generic [ref=e262]:
                      - checkbox "Log a sighting of wild ginger (Asarum canadense)" [ref=e264]
                      - generic [ref=e265]: Log a sighting of wild ginger (Asarum canadense)
                  - listitem [ref=e266]:
                    - generic [ref=e267]:
                      - checkbox "Identify chickweed (Stellaria media) in a field" [ref=e269]
                      - generic [ref=e270]: Identify chickweed (Stellaria media) in a field
            - 'link "View challenge: Mushroom Foraging Fundamentals" [ref=e271] [cursor=pointer]':
              - /url: /community#challenges
              - article [ref=e272]:
                - generic [ref=e274]:
                  - generic [ref=e275]:
                    - heading "Mushroom Foraging Fundamentals" [level=3] [ref=e276]
                    - generic [ref=e277]: Foraging
                  - paragraph [ref=e278]: Learn the basics of mushroom identification in Tennessee by finding and documenting common edible species with expert confirmation.
                - generic [ref=e279]:
                  - generic [ref=e280]:
                    - generic [ref=e281]: Progress
                    - generic [ref=e282]: 0 / 4
                  - progressbar "0 of 4 criteria completed" [ref=e283]
                - list "Challenge criteria" [ref=e284]:
                  - listitem [ref=e285]:
                    - generic [ref=e286]:
                      - checkbox "Identify a Chicken of the Woods in the field" [ref=e288]
                      - generic [ref=e289]: Identify a Chicken of the Woods in the field
                  - listitem [ref=e290]:
                    - generic [ref=e291]:
                      - checkbox "Document a Chanterelle sighting with a photo" [ref=e293]
                      - generic [ref=e294]: Document a Chanterelle sighting with a photo
                  - listitem [ref=e295]:
                    - generic [ref=e296]:
                      - checkbox "Record a Morel location during spring season" [ref=e298]
                      - generic [ref=e299]: Record a Morel location during spring season
                  - listitem [ref=e300]:
                    - generic [ref=e301]:
                      - checkbox "Complete a spore print for any wild mushroom" [ref=e303]
                      - generic [ref=e304]: Complete a spore print for any wild mushroom
            - 'link "View challenge: Know Your Tennessee Trees" [ref=e305] [cursor=pointer]':
              - /url: /community#challenges
              - article [ref=e306]:
                - generic [ref=e308]:
                  - generic [ref=e309]:
                    - heading "Know Your Tennessee Trees" [level=3] [ref=e310]
                    - generic [ref=e311]: Foraging
                  - paragraph [ref=e312]: Build your tree identification skills by recognizing the most common native trees in Tennessee forests.
                - generic [ref=e313]:
                  - generic [ref=e314]:
                    - generic [ref=e315]: Progress
                    - generic [ref=e316]: 0 / 3
                  - progressbar "0 of 3 criteria completed" [ref=e317]
                - list "Challenge criteria" [ref=e318]:
                  - listitem [ref=e319]:
                    - generic [ref=e320]:
                      - checkbox "Identify an Eastern White Oak by its bark and leaves" [ref=e322]
                      - generic [ref=e323]: Identify an Eastern White Oak by its bark and leaves
                  - listitem [ref=e324]:
                    - generic [ref=e325]:
                      - checkbox "Find a Shagbark Hickory and note its shaggy bark" [ref=e327]
                      - generic [ref=e328]: Find a Shagbark Hickory and note its shaggy bark
                  - listitem [ref=e329]:
                    - generic [ref=e330]:
                      - checkbox "Document a Tulip Poplar — Tennessee state tree" [ref=e332]
                      - generic [ref=e333]: Document a Tulip Poplar — Tennessee state tree
        - region "Quick actions" [ref=e334]:
          - link "Compare species side by side" [ref=e335] [cursor=pointer]:
            - /url: /field-guide/compare
            - generic [ref=e336]: 🔍
            - generic [ref=e337]:
              - text: Comparison
              - paragraph [ref=e338]: Compare species side by side
        - link "Explore foraging routes on the map" [ref=e340] [cursor=pointer]:
          - /url: /map
          - generic [ref=e341]: 🗺️
          - generic [ref=e342]:
            - text: Routes
            - paragraph [ref=e343]: Explore foraging routes
        - link "Find mushroom spots on the map" [ref=e345] [cursor=pointer]:
          - /url: /map
          - generic [ref=e346]: 🍄
          - generic [ref=e347]:
            - text: Mushroom Spots
            - paragraph [ref=e348]: Find top mushroom spots
        - link "Explore Community Sightings" [ref=e350] [cursor=pointer]:
          - /url: /community
          - img [ref=e351]
          - text: Explore Community Sightings
        - region "Safety notice" [ref=e353]:
          - paragraph [ref=e354]: ForageWise provides identification assistance only. Always verify with a qualified expert before consuming any wild species.
    - contentinfo [ref=e355]:
      - link "Need help? Contact Support" [ref=e356] [cursor=pointer]:
        - /url: /support
        - img [ref=e357]
        - text: Need help? Contact Support
      - paragraph [ref=e359]: © 2026 ForageWise. All rights reserved.
    - dialog "Welcome tour" [ref=e360]:
      - generic [ref=e361]:
        - generic [ref=e369]:
          - generic [ref=e370]: 🍄
          - heading "Field Guide" [level=2] [ref=e371]
          - paragraph [ref=e372]: Browse 30+ mushroom, plant, and tree species with identification steps, season info, and safety warnings. Works offline.
        - generic [ref=e373]:
          - button "Skip tour" [ref=e374] [cursor=pointer]
          - button "Next" [ref=e375] [cursor=pointer]
  - navigation "Main navigation" [ref=e376]:
    - list [ref=e377]:
      - listitem [ref=e378]:
        - link "Field Guide" [ref=e379] [cursor=pointer]:
          - /url: /field-guide
          - img [ref=e380]
          - generic [ref=e382]: Field Guide
      - listitem [ref=e383]:
        - link "Map" [ref=e384] [cursor=pointer]:
          - /url: /map
          - img [ref=e385]
          - generic [ref=e387]: Map
      - listitem [ref=e388]:
        - link "ID" [ref=e389] [cursor=pointer]:
          - /url: /identify
          - img [ref=e390]
          - generic [ref=e392]: ID
      - listitem [ref=e393]:
        - link "Community" [ref=e394] [cursor=pointer]:
          - /url: /community
          - img [ref=e395]
          - generic [ref=e397]: Community
      - listitem [ref=e398]:
        - link "Plan" [ref=e399] [cursor=pointer]:
          - /url: /parks
          - img [ref=e400]
          - generic [ref=e402]: Plan
  - alert [ref=e403]
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
> 83  |     await weatherBtn.click();
      |                      ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
```