/**
 * Generate placeholder PWA icons as PNG files.
 * Creates simple teal squares with "FF" text for ForageFlow.
 * These are placeholders — replace with proper icons before production.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { deflateSync } from 'zlib';

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Determine if a pixel is part of the "FF" text.
 */
function isFFPixel(x, y, w, h) {
  const letterW = Math.floor(w * 0.18);
  const letterH = Math.floor(h * 0.36);
  const stroke = Math.max(Math.floor(w * 0.04), 2);
  const gap = Math.floor(w * 0.06);

  const totalW = letterW * 2 + gap;
  const startX = Math.floor((w - totalW) / 2);
  const startY = Math.floor((h - letterH) / 2);

  return (
    isLetterF(x - startX, y - startY, letterW, letterH, stroke) ||
    isLetterF(x - startX - letterW - gap, y - startY, letterW, letterH, stroke)
  );
}

function isLetterF(lx, ly, lw, lh, stroke) {
  if (lx < 0 || lx >= lw || ly < 0 || ly >= lh) return false;
  if (lx < stroke) return true;
  if (ly < stroke) return true;
  const midY = Math.floor(lh / 2);
  if (ly >= midY - Math.floor(stroke / 2) && ly < midY + Math.ceil(stroke / 2) && lx < lw * 0.75) return true;
  return false;
}

function createPNG(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createChunk('IHDR', ihdrData);

  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      if (isFFPixel(x, y, width, height)) {
        rawData.push(245, 240, 223); // Sand #F5F0DF
      } else {
        rawData.push(r, g, b);
      }
    }
  }

  const compressed = deflateSync(Buffer.from(rawData));
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Ensure output directory exists
mkdirSync('public/icons', { recursive: true });

// Teal background: #0F766E = rgb(15, 118, 110)
const sizes = [192, 512];
for (const size of sizes) {
  const png = createPNG(size, size, 15, 118, 110);
  writeFileSync(`public/icons/icon-${size}x${size}.png`, png);
  console.log(`Created icon-${size}x${size}.png`);

  writeFileSync(`public/icons/icon-maskable-${size}x${size}.png`, png);
  console.log(`Created icon-maskable-${size}x${size}.png`);
}

// Apple touch icon (180x180)
const applePng = createPNG(180, 180, 15, 118, 110);
writeFileSync('public/icons/apple-touch-icon.png', applePng);
console.log('Created apple-touch-icon.png');

console.log('All placeholder icons generated.');
