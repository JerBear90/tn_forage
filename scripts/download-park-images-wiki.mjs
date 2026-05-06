/**
 * Download park images via Wikipedia REST API (page summaries).
 *
 * This uses a different endpoint than the Commons API, so it has
 * separate rate limits. Each park is looked up by its Wikipedia
 * article title, and the lead image thumbnail is downloaded.
 *
 * Run: node scripts/download-park-images-wiki.mjs
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync, unlinkSync, renameSync } from 'fs';
import https from 'https';
import { join } from 'path';
import sharp from 'sharp';

const PARKS_DIR = join(process.cwd(), 'public', 'images', 'parks');
mkdirSync(PARKS_DIR, { recursive: true });

const USER_AGENT = 'ForageWiseBot/1.0 (https://github.com/foragewise; foragewise-app@example.com)';
const DOWNLOAD_USER_AGENT = 'Mozilla/5.0 (compatible; ForageWiseBot/1.0; +https://github.com/foragewise)';

// Use http module as well for redirects
import http from 'http';

// [parkId, Wikipedia article title]
const PARKS = [
  ['park-booker-t-washington', 'Booker_T._Washington_State_Park_(Tennessee)'],
  ['park-red-clay', 'Red_Clay_State_Historic_Park'],
  ['park-hiwassee-ocoee', 'Hiwassee/Ocoee_Scenic_River_State_Park'],
  ['park-indian-mountain', 'Indian_Mountain_State_Park'],
  ['park-norris-dam', 'Norris_Dam_State_Park'],
  ['park-panther-creek', 'Panther_Creek_State_Park'],
  ['park-pickett-ccc', 'Pickett_CCC_Memorial_State_Park'],
  ['park-roan-mountain', 'Roan_Mountain_State_Park'],
  ['park-seven-islands', 'Seven_Islands_State_Birding_Park'],
  ['park-sycamore-shoals', 'Sycamore_Shoals_State_Historic_Park'],
  ['park-warriors-path', "Warriors'_Path_State_Park"],
  ['park-bicentennial-capitol-mall', 'Bicentennial_Capitol_Mall_State_Park'],
  ['park-bledsoe-creek', 'Bledsoe_Creek_State_Park'],
  ['park-cedars-of-lebanon', 'Cedars_of_Lebanon_State_Park'],
  ['park-cummins-falls', 'Cummins_Falls_State_Park'],
  ['park-dunbar-cave', 'Dunbar_Cave_State_Park'],
  ['park-edgar-evins', 'Edgar_Evins_State_Park'],
  ['park-fall-creek-falls', 'Fall_Creek_Falls_State_Park'],
  ['park-henry-horton', 'Henry_Horton_State_Park'],
  ['park-long-hunter', 'Long_Hunter_State_Park'],
  ['park-montgomery-bell', 'Montgomery_Bell_State_Park'],
  ['park-mousetail-landing', 'Mousetail_Landing_State_Park'],
  ['park-old-stone-fort', 'Old_Stone_Fort_State_Archaeological_Park'],
  ['park-port-royal', 'Port_Royal_State_Historic_Park'],
  ['park-radnor-lake', 'Radnor_Lake_State_Park'],
  ['park-rock-island', 'Rock_Island_State_Park_(Tennessee)'],
  ['park-savage-gulf', 'Savage_Gulf_State_Natural_Area'],
  ['park-south-cumberland', 'South_Cumberland_State_Park'],
  ['park-standing-stone', 'Standing_Stone_State_Park'],
  ['park-tims-ford', 'Tims_Ford_State_Park'],
  ['park-virgin-falls', 'Virgin_Falls'],
  ['park-david-crockett', 'David_Crockett_State_Park'],
  ['park-johnsonville', 'Johnsonville_State_Historic_Park'],
  ['park-cordell-hull-birthplace', 'Cordell_Hull_Birthplace_State_Historic_Park'],
  ['park-big-cypress-tree', 'Big_Cypress_Tree_State_Park'],
  ['park-big-hill-pond', 'Big_Hill_Pond_State_Park'],
  ['park-chickasaw', 'Chickasaw_State_Park_(Tennessee)'],
  ['park-fort-pillow', 'Fort_Pillow_State_Historic_Park'],
  ['park-meeman-shelby-forest', 'Meeman-Shelby_Forest_State_Park'],
  ['park-natchez-trace', 'Natchez_Trace_State_Park'],
  ['park-nathan-bedford-forrest', 'Nathan_Bedford_Forrest_State_Park'],
  ['park-paris-landing', 'Paris_Landing_State_Park'],
  ['park-pickwick-landing', 'Pickwick_Landing_State_Park'],
  ['park-pinson-mounds', 'Pinson_Mounds'],
  ['park-reelfoot-lake', 'Reelfoot_Lake_State_Park'],
  ['park-t-o-fuller', 'T.O._Fuller_State_Park'],
  ['park-fuller', 'Fuller_State_Park'],
  ['park-cypress-grove', 'Cypress_Grove_Nature_Park'],
];

const delay = (ms) => new Promise(r => setTimeout(r, ms));

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': USER_AGENT,
      'Api-User-Agent': USER_AGENT,
      'Accept': 'application/json',
    };
    https.get(url, { headers }, (res) => {
      if (res.statusCode === 429) { reject(new Error('RATE_LIMITED')); return; }
      if (res.statusCode === 404) { reject(new Error('NOT_FOUND')); return; }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(new Error('Invalid JSON')); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': DOWNLOAD_USER_AGENT } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error(`Download HTTP ${res.statusCode}`)); return; }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => { const buf = Buffer.concat(chunks); writeFileSync(dest, buf); resolve(buf.length); });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function optimizeImage(filepath) {
  const buf = readFileSync(filepath);
  const out = await sharp(buf).resize(800).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  if (out.length < buf.length) {
    const tmp = filepath + '.tmp';
    writeFileSync(tmp, out);
    unlinkSync(filepath);
    renameSync(tmp, filepath);
    return out.length;
  }
  return buf.length;
}

async function fetchParkImage(parkId, wikiTitle) {
  const dest = join(PARKS_DIR, `${parkId}.jpg`);
  if (existsSync(dest)) {
    console.log(`  SKIP: ${parkId} (exists)`);
    return true;
  }

  // Strategy 1: Wikipedia REST API page summary
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
    const data = await fetchJson(url);
    const imageUrl = data.originalimage?.source || data.thumbnail?.source;
    if (imageUrl) {
      await delay(2000);
      await downloadFile(imageUrl, dest);
      const optimized = await optimizeImage(dest);
      console.log(`  OK: ${parkId} (${(optimized / 1024).toFixed(0)} KB) [REST API]`);
      return true;
    }
  } catch (err) {
    if (err.message === 'RATE_LIMITED') {
      console.log(`  RATE LIMITED — waiting 30s...`);
      await delay(30000);
    }
    // Fall through to strategy 2
  }

  // Strategy 2: Wikipedia action API — get page images
  try {
    await delay(2000);
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages&piprop=original&format=json`;
    const data = await fetchJson(apiUrl);
    const pages = data.query?.pages;
    if (pages) {
      for (const pageId of Object.keys(pages)) {
        const original = pages[pageId]?.original?.source;
        if (original) {
          await delay(2000);
          await downloadFile(original, dest);
          const optimized = await optimizeImage(dest);
          console.log(`  OK: ${parkId} (${(optimized / 1024).toFixed(0)} KB) [Action API]`);
          return true;
        }
      }
    }
  } catch (err) {
    if (err.message === 'RATE_LIMITED') {
      console.log(`  RATE LIMITED — waiting 30s...`);
      await delay(30000);
    }
    // Fall through to strategy 3
  }

  // Strategy 3: Wikimedia Commons search
  try {
    await delay(2000);
    const searchQuery = wikiTitle.replace(/_/g, ' ');
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srnamespace=6&srlimit=5&format=json`;
    const searchResult = await fetchJson(searchUrl);
    const imageTitles = (searchResult.query?.search || [])
      .map(r => r.title)
      .filter(t => /\.(jpg|jpeg|png)$/i.test(t));

    if (imageTitles.length > 0) {
      await delay(2000);
      const titlesParam = imageTitles.map(t => encodeURIComponent(t)).join('|');
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${titlesParam}&prop=imageinfo&iiprop=url&format=json`;
      const infoResult = await fetchJson(infoUrl);
      const pages = infoResult.query?.pages;
      if (pages) {
        for (const pageKey of Object.keys(pages)) {
          const imgUrl = pages[pageKey]?.imageinfo?.[0]?.url;
          if (imgUrl) {
            await delay(2000);
            await downloadFile(imgUrl, dest);
            const optimized = await optimizeImage(dest);
            console.log(`  OK: ${parkId} (${(optimized / 1024).toFixed(0)} KB) [Commons]`);
            return true;
          }
        }
      }
    }
  } catch (err) {
    // All strategies failed
  }

  console.log(`  MISS: ${parkId} — no image found via any strategy`);
  return false;
}

async function main() {
  console.log(`Downloading images for ${PARKS.length} parks via Wikipedia REST API...`);
  console.log(`2s delay between requests.\n`);

  let ok = 0, miss = 0;
  const missing = [];
  for (let i = 0; i < PARKS.length; i++) {
    const [parkId, wikiTitle] = PARKS[i];
    console.log(`[${i + 1}/${PARKS.length}] ${parkId}`);
    const found = await fetchParkImage(parkId, wikiTitle);
    if (found) ok++; else { miss++; missing.push(parkId); }
    if (i < PARKS.length - 1) await delay(2000);
  }
  console.log(`\nDone: ${ok} downloaded, ${miss} missing`);
  if (missing.length > 0) {
    console.log(`\nMissing parks:\n${missing.map(p => `  - ${p}`).join('\n')}`);
  }
}

main();
