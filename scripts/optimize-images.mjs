/**
 * Optimize all species/plant/tree images for mobile.
 * Resizes to max 800px wide and compresses to quality 80 JPEG.
 * Overwrites originals in-place.
 */
import sharp from 'sharp';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIRS = [
  'public/images/species',
  'public/images/plants',
  'public/images/trees',
];

const MAX_WIDTH = 800;
const QUALITY = 80;

async function optimizeFile(filepath) {
  const { writeFileSync, unlinkSync, renameSync } = await import('fs');
  const before = statSync(filepath).size;

  // Read into buffer first to release file handle
  const { readFileSync } = await import('fs');
  const inputBuffer = readFileSync(filepath);
  const img = sharp(inputBuffer);
  const meta = await img.metadata();

  // Only resize if wider than MAX_WIDTH
  const needsResize = meta.width && meta.width > MAX_WIDTH;

  const buffer = await (needsResize ? sharp(inputBuffer).resize(MAX_WIDTH) : sharp(inputBuffer))
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer();

  // Only write if we actually reduced size
  if (buffer.length < before) {
    const tmpPath = filepath + '.tmp';
    writeFileSync(tmpPath, buffer);
    unlinkSync(filepath);
    renameSync(tmpPath, filepath);
    const after = buffer.length;
    const pct = ((1 - after / before) * 100).toFixed(0);
    console.log(
      `${filepath.split(/[/\\]/).pop()}: ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB (-${pct}%)`
    );
  } else {
    console.log(`${filepath.split(/[/\\]/).pop()}: already optimal (${(before / 1024).toFixed(0)} KB)`);
  }
}

async function main() {
  let total = 0;
  for (const dir of DIRS) {
    const files = readdirSync(dir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    for (const file of files) {
      await optimizeFile(join(dir, file));
      total++;
    }
  }
  console.log(`\nOptimized ${total} images.`);
}

main().catch(console.error);
