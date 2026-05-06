# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-online-verify.spec.ts >> OFFLINE — Core Features Must Still Work >> profile page works offline
- Location: tests\e2e\offline-online-verify.spec.ts:178:7

# Error details

```
Error: page.reload: net::ERR_INTERNET_DISCONNECTED
Call log:
  - waiting for navigation until "load"

```

# Test source

```ts
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
> 183 |     await page.reload();
      |                ^ Error: page.reload: net::ERR_INTERNET_DISCONNECTED
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
  209 |     await context.setOffline(true);
  210 | 
  211 |     // Navigate via bottom nav
  212 |     const nav = page.getByRole('navigation', { name: /main navigation/i });
  213 |     await expect(nav).toBeVisible();
  214 | 
  215 |     await context.setOffline(false);
  216 |   });
  217 | });
  218 | 
  219 | // ---------------------------------------------------------------------------
  220 | // TRANSITION TESTS — Going offline then back online
  221 | // ---------------------------------------------------------------------------
  222 | 
  223 | test.describe('TRANSITION — Offline to Online', () => {
  224 |   test('app recovers gracefully when going back online', async ({ page, context }) => {
  225 |     await page.goto('/');
  226 |     await page.waitForTimeout(3000);
  227 | 
  228 |     // Go offline
  229 |     await context.setOffline(true);
  230 |     await page.waitForTimeout(1000);
  231 | 
  232 |     // Go back online
  233 |     await context.setOffline(false);
  234 |     await page.waitForTimeout(2000);
  235 | 
  236 |     // App should still be functional
  237 |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  238 |   });
  239 | 
  240 |   test('data persists across offline/online cycles', async ({ page, context }) => {
  241 |     // Load field guide online
  242 |     await page.goto('/field-guide');
  243 |     await page.waitForTimeout(5000);
  244 | 
  245 |     const countOnline = await page.locator('a[href^="/field-guide/sp-"]').count();
  246 | 
  247 |     // Cycle: offline → online → check data
  248 |     await context.setOffline(true);
  249 |     await page.waitForTimeout(500);
  250 |     await context.setOffline(false);
  251 |     await page.reload();
  252 |     await page.waitForTimeout(5000);
  253 | 
  254 |     const countAfterCycle = await page.locator('a[href^="/field-guide/sp-"]').count();
  255 |     expect(countAfterCycle).toBe(countOnline);
  256 |   });
  257 | });
  258 | 
```