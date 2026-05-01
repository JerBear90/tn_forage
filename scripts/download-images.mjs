/**
 * Download all species/plant/tree images from Wikimedia Commons
 * into public/images/species/ and public/images/trees/ for local serving.
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import https from 'https';
import http from 'http';

const SPECIES_DIR = join(process.cwd(), 'public', 'images', 'species');
const TREES_DIR = join(process.cwd(), 'public', 'images', 'trees');
const PLANTS_DIR = join(process.cwd(), 'public', 'images', 'plants');

mkdirSync(SPECIES_DIR, { recursive: true });
mkdirSync(TREES_DIR, { recursive: true });
mkdirSync(PLANTS_DIR, { recursive: true });

// All images to download: [url, localFilename, directory]
const images = [
  // === MUSHROOM SPECIES ===
  ['https://upload.wikimedia.org/wikipedia/commons/8/80/Chicken_of_the_Woods_Laetiporus_sulphureus.jpg', 'sp-chicken-of-the-woods.jpg', SPECIES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/8/86/Cantharellus_cibarius1.jpg', 'sp-chanterelle.jpg', SPECIES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/7/76/Morchella_conica-42.jpg', 'sp-morel.jpg', SPECIES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/c/cb/Grifola_frondosa.jpg', 'sp-hen-of-the-woods.jpg', SPECIES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/0/00/Igelstachelbart_Nov_06.jpg', 'sp-lions-mane.jpg', SPECIES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/9/91/Destroying_Angel.jpg', 'sp-destroying-angel.jpg', SPECIES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/c/c6/Omphalotus_olearius.jpg', 'sp-jack-o-lantern.jpg', SPECIES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/1/1c/Gyromitra_esculenta.jpg', 'sp-false-morel.jpg', SPECIES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/1/1b/Trametes_versicolor.jpg', 'sp-turkey-tail.jpg', SPECIES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/a/af/Ganoderma_tsugae.jpg', 'sp-reishi.jpg', SPECIES_DIR],

  // === PLANTS ===
  ['https://upload.wikimedia.org/wikipedia/commons/b/b5/Allium_tricoccum.jpg', 'pl-ramps.jpg', PLANTS_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/b/b6/Asimina_triloba_-_Pawpaw.jpg', 'pl-pawpaw.jpg', PLANTS_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/7/70/Phytolacca_americana.jpg', 'pl-pokeweed.jpg', PLANTS_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/0/08/Toxicodendron_radicans%2C_leaves.jpg', 'pl-poison-ivy.jpg', PLANTS_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/a/ae/Asarum_canadense.jpg', 'pl-wild-ginger.jpg', PLANTS_DIR],

  // === TREES ===
  ['https://upload.wikimedia.org/wikipedia/commons/6/68/Quercus_alba.jpg', 'tree-white-oak.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/7/7b/Quercus_rubra.jpg', 'tree-northern-red-oak.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/2/28/Chestnut_Oak_Quercus_Montana_bark.jpg', 'tree-chestnut-oak.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/9/91/Quercus_falcata_leaves.jpg', 'tree-southern-red-oak.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/1/10/Quercus_stellata.jpg', 'tree-post-oak.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/6/66/Quercus_velutina.jpg', 'tree-black-oak.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/1/15/Quercus_coccinea.jpg', 'tree-scarlet-oak.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/4/4f/Carya_ovata.jpg', 'tree-shagbark-hickory.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/f/fa/Carya_glabra.jpg', 'tree-pignut-hickory.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/d/d0/Carya_tomentosa.jpg', 'tree-mockernut-hickory.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/8/8e/Carya_cordiformis.jpg', 'tree-bitternut-hickory.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/f/f6/Acer_rubrum.jpg', 'tree-red-maple.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/2/26/Acer_saccharum.jpg', 'tree-sugar-maple.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/0/05/Liriodendron_tulipifera.jpg', 'tree-tulip-poplar.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/6/6c/Populus_deltoides.jpg', 'tree-eastern-cottonwood.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/8/8e/Pinus_echinata_bark.jpg', 'tree-shortleaf-pine.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/0/01/Pinus_virginiana.jpg', 'tree-virginia-pine.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/f/f2/Pinus_taeda.jpg', 'tree-loblolly-pine.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/b/be/Pinus_strobus.jpg', 'tree-eastern-white-pine.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/d/de/Fagus_grandifolia.jpg', 'tree-american-beech.jpg', TREES_DIR],
  ['https://commons.wikimedia.org/wiki/Special:FilePath/Ulmus_americana_(American_Elm).jpg', 'tree-american-elm.jpg', TREES_DIR],
  ['https://commons.wikimedia.org/wiki/Special:FilePath/Ulmus_rubra.jpg', 'tree-slippery-elm.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/0/01/Juglans_nigra.jpg', 'tree-black-walnut.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/5/5c/Tsuga_canadensis.jpg', 'tree-eastern-hemlock.jpg', TREES_DIR],
  ['https://commons.wikimedia.org/wiki/Special:FilePath/Platanus_occidentalis.jpg', 'tree-american-sycamore.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/2/24/Liquidambar_styraciflua.jpg', 'tree-sweetgum.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/8/87/Betula_alleghaniensis.jpg', 'tree-yellow-birch.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/9/98/Betula_nigra.jpg', 'tree-river-birch.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/6/6e/Fraxinus_americana.jpg', 'tree-white-ash.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/0/0f/Tilia_americana.jpg', 'tree-american-basswood.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/7/71/Cornus_florida.jpg', 'tree-flowering-dogwood.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/f/f8/Cercis_canadensis.jpg', 'tree-eastern-redbud.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/5/5d/Sassafras_albidum.jpg', 'tree-sassafras.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/4/44/Nyssa_sylvatica.jpg', 'tree-black-gum.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/b/be/Oxydendrum_arboreum.jpg', 'tree-sourwood.jpg', TREES_DIR],
  ['https://upload.wikimedia.org/wikipedia/commons/a/af/Juniperus_virginiana.jpg', 'tree-eastern-red-cedar.jpg', TREES_DIR],
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (existsSync(dest)) {
      console.log(`SKIP (exists): ${dest}`);
      resolve();
      return;
    }
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { headers: { 'User-Agent': 'ForageFlow/1.0 (field-guide-app; contact@forageflow.app)' } }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`  REDIRECT: ${res.headers.location}`);
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        writeFileSync(dest, buf);
        console.log(`OK: ${dest} (${(buf.length / 1024).toFixed(0)} KB)`);
        resolve();
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

async function main() {
  let ok = 0, fail = 0;
  for (const [url, filename, dir] of images) {
    const dest = join(dir, filename);
    try {
      await download(url, dest);
      ok++;
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`FAIL: ${filename} — ${err.message}`);
      fail++;
    }
  }
  console.log(`\nDone: ${ok} downloaded, ${fail} failed`);
}

main();
