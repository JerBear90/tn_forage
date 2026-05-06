/**
 * Download park images from Wikimedia Commons.
 *
 * Uses batch API calls and 5-second delays to stay well under
 * Wikimedia's rate limits. Skips already-downloaded images.
 *
 * Run: node scripts/download-park-images.mjs
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import https from 'https';
import { join } from 'path';
import sharp from 'sharp';

const PARKS_DIR = join(process.cwd(), 'public', 'images', 'parks');
mkdirSync(PARKS_DIR, { recursive: true });

const USER_AGENT = 'ForageWiseBot/1.0 (https://github.com/foragewise; foragewise-app@example.com) node-https';

// Park names to search for on Wikimedia Commons
const PARKS = [
  ['park-big-ridge', 'Big Ridge State Park Tennessee'],
  ['park-cove-lake', 'Cove Lake State Park Tennessee'],
  ['park-cumberland-gap', 'Cumberland Gap National Historical Park'],
  ['park-cumberland-trail', 'Cumberland Trail Tennessee hiking'],
  ['park-davy-crockett-birthplace', 'Davy Crockett Birthplace State Park'],
  ['park-fort-loudoun', 'Fort Loudoun Tennessee'],
  ['park-frozen-head', 'Frozen Head State Park Tennessee'],
  ['park-harrison-bay', 'Harrison Bay State Park Tennessee'],
  ['park-booker-t-washington', 'Booker T Washington State Park Chattanooga'],
  ['park-red-clay', 'Red Clay State Historic Park Tennessee'],
  ['park-hiwassee-ocoee', 'Hiwassee Ocoee River Tennessee'],
  ['park-indian-mountain', 'Indian Mountain State Park Tennessee'],
  ['park-norris-dam', 'Norris Dam Tennessee'],
  ['park-panther-creek', 'Panther Creek State Park Tennessee'],
  ['park-pickett-ccc', 'Pickett State Park Tennessee'],
  ['park-roan-mountain', 'Roan Mountain Tennessee'],
  ['park-seven-islands', 'Seven Islands Birding Park Tennessee'],
  ['park-sycamore-shoals', 'Sycamore Shoals Tennessee'],
  ['park-warriors-path', 'Warriors Path State Park Kingsport'],
  ['park-harpeth-river', 'Harpeth River Tennessee'],
  ['park-window-cliffs', 'Window Cliffs Tennessee waterfall'],
  ['park-bicentennial-capitol-mall', 'Bicentennial Capitol Mall Nashville Tennessee'],
  ['park-bledsoe-creek', 'Bledsoe Creek State Park Tennessee'],
  ['park-burgess-falls', 'Burgess Falls Tennessee'],
  ['park-cedars-of-lebanon', 'Cedars of Lebanon State Park Tennessee'],
  ['park-cummins-falls', 'Cummins Falls Tennessee'],
  ['park-dunbar-cave', 'Dunbar Cave Clarksville Tennessee'],
  ['park-edgar-evins', 'Edgar Evins State Park Tennessee'],
  ['park-fall-creek-falls', 'Fall Creek Falls Tennessee'],
  ['park-henry-horton', 'Henry Horton State Park Tennessee'],
  ['park-long-hunter', 'Long Hunter State Park Tennessee'],
  ['park-montgomery-bell', 'Montgomery Bell State Park Tennessee'],
  ['park-mousetail-landing', 'Mousetail Landing State Park Tennessee'],
  ['park-old-stone-fort', 'Old Stone Fort Tennessee Manchester'],
  ['park-port-royal', 'Port Royal State Historic Park Tennessee'],
  ['park-radnor-lake', 'Radnor Lake Nashville Tennessee'],
  ['park-rock-island', 'Rock Island State Park Tennessee waterfall'],
  ['park-savage-gulf', 'Savage Gulf Tennessee'],
  ['park-south-cumberland', 'South Cumberland State Park Tennessee'],
  ['park-standing-stone', 'Standing Stone State Park Tennessee'],
  ['park-tims-ford', 'Tims Ford State Park Tennessee'],
  ['park-virgin-falls', 'Virgin Falls Tennessee'],
  ['park-david-crockett', 'David Crockett State Park Lawrenceburg Tennessee'],
  ['park-johnsonville', 'Johnsonville State Historic Park Tennessee'],
  ['park-stones-river-greenway', 'Stones River Greenway Nashville'],
  ['park-cordell-hull-birthplace', 'Cordell Hull Birthplace Byrdstown Tennessee'],
  ['park-sergeant-alvin-c-york', 'Sergeant Alvin York Pall Mall Tennessee'],
  ['park-big-cypress-tree', 'Big Cypress Tree State Park Tennessee'],
  ['park-big-hill-pond', 'Big Hill Pond State Park Tennessee'],
  ['park-chickasaw', 'Chickasaw State Park Henderson Tennessee'],
  ['park-fort-pillow', 'Fort Pillow State Historic Park Tennessee'],
  ['park-meeman-shelby', 'Meeman Shelby Forest State Park Memphis'],
  ['park-natchez-trace', 'Natchez Trace State Park Tennessee'],
  ['park-nathan-bedford-forrest', 'Nathan Bedford Forrest State Park Tennessee River'],
  ['park-paris-landing', 'Paris Landing State Park Kentucky Lake'],
  ['park-pickwick-landing', 'Pickwick Landing State Park Tennessee'],
  ['park-pinson-mounds', 'Pinson Mounds Tennessee'],
  ['park-reelfoot-lake', 'Reelfoot Lake Tennessee'],
  ['park-t-o-fuller', 'T O Fuller State Park Memphis Tennessee'],
  ['park-fuller', 'Fuller State Park Tennessee'],
  ['park-cypress-grove', 'Cypress Grove Nature Park Jackson Tennessee'],
];

const delay = (ms) => new Promise(r => setTimeout(r, ms));

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      if (res.statusCode === 429) {
        reject(new Error('RATE_LIMITED'));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(new Error('Invalid JSON response — likely rate limited')); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
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
    const { unlinkSync, renameSync } = await import('fs');
    unlinkSync(filepath);
    renameSync(tmp, filepath);
    return out.length;
  }
  return buf.length;
}

async function findAndDownload(parkId, searchQuery) {
  const dest = join(PARKS_DIR, `${parkId}.jpg`);
  if (existsSync(dest)) {
    console.log(`  SKIP: ${parkId} (exists)`);
    return true;
  }

  try {
    // Search Wikimedia Commons
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srnamespace=6&srlimit=5&format=json`;
    const searchResult = await fetchJson(searchUrl);

    if (!searchResult.query?.search?.length) {
      console.log(`  MISS: ${parkId} — no results for "${searchQuery}"`);
      return false;
    }

    // Collect all JPEG/PNG titles from search results
    const imageTitles = searchResult.query.search
      .map(r => r.title)
      .filter(t => /\.(jpg|jpeg|png)$/i.test(t));

    if (imageTitles.length === 0) {
      console.log(`  MISS: ${parkId} — no image files in results`);
      return false;
    }

    // Batch lookup: get URLs for all found images in one API call
    await delay(3000);
    const titlesParam = imageTitles.map(t => encodeURIComponent(t)).join('|');
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${titlesParam}&prop=imageinfo&iiprop=url&format=json`;
    const infoResult = await fetchJson(infoUrl);

    const pages = infoResult.query?.pages;
    if (!pages) {
      console.log(`  MISS: ${parkId} — no page info returned`);
      return false;
    }

    // Find the first valid image URL
    for (const pageKey of Object.keys(pages)) {
      const imageUrl = pages[pageKey]?.imageinfo?.[0]?.url;
      if (!imageUrl) continue;

      // Download
      await delay(3000);
      const size = await downloadFile(imageUrl, dest);

      // Optimize (resize to 800px, compress)
      const optimized = await optimizeImage(dest);
      console.log(`  OK: ${parkId} (${(optimized/1024).toFixed(0)} KB) — ${pages[pageKey].title}`);
      return true;
    }

    console.log(`  MISS: ${parkId} — no downloadable URLs`);
    return false;
  } catch (err) {
    if (err.message === 'RATE_LIMITED') {
      console.log(`  RATE LIMITED on ${parkId} — waiting 30s before retry...`);
      await delay(30000);
      // Retry once
      try {
        return await findAndDownload(parkId, searchQuery);
      } catch {
        console.log(`  FAIL: ${parkId} — still rate limited after retry`);
        return false;
      }
    }
    console.log(`  FAIL: ${parkId} — ${err.message}`);
    return false;
  }
}

async function main() {
  console.log(`Downloading images for ${PARKS.length} parks...`);
  console.log(`Using 5s delays between parks to respect Wikimedia rate limits.\n`);

  let ok = 0, miss = 0, fail = 0;
  for (let i = 0; i < PARKS.length; i++) {
    const [parkId, query] = PARKS[i];
    console.log(`[${i + 1}/${PARKS.length}] ${parkId}`);
    const found = await findAndDownload(parkId, query);
    if (found) ok++; else miss++;

    // 5 second delay between parks
    if (i < PARKS.length - 1) {
      await delay(5000);
    }
  }
  console.log(`\nDone: ${ok} downloaded, ${miss} missing/failed`);
}

main();
