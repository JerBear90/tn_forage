/**
 * ForageWise — Screenshot Capture Script
 *
 * Captures screenshots of key app pages for use on the landing page.
 * Run with: npx playwright test scripts/capture-screenshots.ts
 * Or directly: npx ts-node scripts/capture-screenshots.ts
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3000
 * - Playwright installed (npx playwright install)
 *
 * Output: public/images/screenshots/
 */

import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'screenshots');

// Phone viewport (iPhone 14 Pro dimensions)
const PHONE_VIEWPORT = { width: 393, height: 852 };

// Pages to capture
const PAGES = [
  { name: 'home', path: '/', description: 'Homepage with seasonal highlights' },
  { name: 'field-guide', path: '/field-guide', description: 'Field Guide species list' },
  { name: 'species-detail', path: '/field-guide/sp-chanterelle', description: 'Species detail page' },
  { name: 'map', path: '/map', description: 'Interactive park map' },
  { name: 'mushroom-calendar', path: '/mushroom-calendar', description: 'Mushroom calendar view' },
  { name: 'identify', path: '/identify', description: 'Identification wizard' },
  { name: 'identify-ai', path: '/identify/ai', description: 'AI photo identification' },
  { name: 'community', path: '/community', description: 'Community sightings' },
  { name: 'parks', path: '/parks', description: 'Parks list' },
  { name: 'settings', path: '/settings', description: 'Settings page' },
];

async function captureScreenshots() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Capturing screenshots to: ${OUTPUT_DIR}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log('---');

  const browser = await chromium.launch({ headless: true });

  // Mobile screenshots
  const mobileContext = await browser.newContext({
    viewport: PHONE_VIEWPORT,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  const mobilePage = await mobileContext.newPage();

  for (const pageConfig of PAGES) {
    try {
      console.log(`Capturing: ${pageConfig.name} (${pageConfig.path})`);
      await mobilePage.goto(`${BASE_URL}${pageConfig.path}`, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });

      // Wait a bit for animations/lazy loading
      await mobilePage.waitForTimeout(1500);

      // Capture full page
      await mobilePage.screenshot({
        path: path.join(OUTPUT_DIR, `${pageConfig.name}-mobile.png`),
        fullPage: false,
      });

      // Also capture full-page scroll version
      await mobilePage.screenshot({
        path: path.join(OUTPUT_DIR, `${pageConfig.name}-mobile-full.png`),
        fullPage: true,
      });

      console.log(`  Done: ${pageConfig.name}-mobile.png`);
    } catch (err) {
      console.error(`  Failed: ${pageConfig.name} - ${(err as Error).message}`);
    }
  }

  await mobileContext.close();

  // Desktop screenshots
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const desktopPage = await desktopContext.newPage();

  for (const pageConfig of PAGES) {
    try {
      console.log(`Capturing desktop: ${pageConfig.name} (${pageConfig.path})`);
      await desktopPage.goto(`${BASE_URL}${pageConfig.path}`, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });

      await desktopPage.waitForTimeout(1500);

      await desktopPage.screenshot({
        path: path.join(OUTPUT_DIR, `${pageConfig.name}-desktop.png`),
        fullPage: false,
      });

      console.log(`  Done: ${pageConfig.name}-desktop.png`);
    } catch (err) {
      console.error(`  Failed: ${pageConfig.name} - ${(err as Error).message}`);
    }
  }

  await desktopContext.close();
  await browser.close();

  console.log('---');
  console.log('Screenshot capture complete!');
  console.log(`Files saved to: ${OUTPUT_DIR}`);
}

captureScreenshots().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
