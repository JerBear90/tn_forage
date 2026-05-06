/**
 * Download missing plant images via Wikipedia REST API (page summaries).
 *
 * Uses the scientific name to look up the Wikipedia article and downloads
 * the lead image thumbnail.
 *
 * Run: node scripts/download-plant-images-wiki.mjs
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync, unlinkSync, renameSync } from 'fs';
import https from 'https';
import http from 'http';
import { join } from 'path';
import sharp from 'sharp';

const PLANTS_DIR = join(process.cwd(), 'public', 'images', 'plants');
mkdirSync(PLANTS_DIR, { recursive: true });

const USER_AGENT = 'ForageWiseBot/1.0 (https://github.com/foragewise; foragewise-app@example.com)';
const DOWNLOAD_USER_AGENT = 'Mozilla/5.0 (compatible; ForageWiseBot/1.0; +https://github.com/foragewise)';

// [plantId, Wikipedia article title (from scientific name)]
const PLANTS = [
  ['pl-chicory', 'Cichorium_intybus'],
  ['pl-elderberry', 'Sambucus_nigra'],
  ['pl-stinging-nettle', 'Urtica_dioica'],
  ['pl-virginia-creeper', 'Parthenocissus_quinquefolia'],
  ['pl-black-cohosh', 'Actaea_racemosa'],
  ['pl-wild-violet', 'Viola_sororia'],
  ['pl-mayapple', 'Podophyllum_peltatum'],
  ['pl-spicebush', 'Lindera_benzoin'],
  ['pl-poison-hemlock', 'Conium_maculatum'],
  ['pl-wild-bergamot', 'Monarda_fistulosa'],
  ['pl-jerusalem-artichoke', 'Helianthus_tuberosus'],
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

async function fetchPlantImage(plantId, wikiTitle) {
  const dest = join(PLANTS_DIR, `${plantId}.jpg`);
  if (existsSync(dest)) {
    console.log(`  SKIP: ${plantId} (exists)`);
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
      console.log(`  OK: ${plantId} (${(optimized / 1024).toFixed(0)} KB) [REST API]`);
      return true;
    }
  } catch (err) {
    if (err.message === 'RATE_LIMITED') {
      console.log(`  RATE LIMITED — waiting 30s...`);
      await delay(30000);
    }
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
          console.log(`  OK: ${plantId} (${(optimized / 1024).toFixed(0)} KB) [Action API]`);
          return true;
        }
      }
    }
  } catch (err) {
    if (err.message === 'RATE_LIMITED') {
      console.log(`  RATE LIMITED — waiting 30s...`);
      await delay(30000);
    }
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
            console.log(`  OK: ${plantId} (${(optimized / 1024).toFixed(0)} KB) [Commons]`);
            return true;
          }
        }
      }
    }
  } catch (err) {
    // All strategies failed
  }

  console.log(`  MISS: ${plantId} — no image found via any strategy`);
  return false;
}

async function main() {
  console.log(`Downloading images for ${PLANTS.length} plants via Wikipedia REST API...`);
  console.log(`2s delay between requests.\n`);

  let ok = 0, miss = 0;
  const missing = [];
  for (let i = 0; i < PLANTS.length; i++) {
    const [plantId, wikiTitle] = PLANTS[i];
    console.log(`[${i + 1}/${PLANTS.length}] ${plantId}`);
    const found = await fetchPlantImage(plantId, wikiTitle);
    if (found) ok++; else { miss++; missing.push(plantId); }
    if (i < PLANTS.length - 1) await delay(2000);
  }
  console.log(`\nDone: ${ok} downloaded, ${miss} missing`);
  if (missing.length > 0) {
    console.log(`\nMissing plants:\n${missing.map(p => `  - ${p}`).join('\n')}`);
  }
}

main();
