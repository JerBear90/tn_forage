import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function createPlaceholder(filename, width, height, color1, color2) {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1}"/>
        <stop offset="100%" style="stop-color:${color2}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <g transform="translate(${width/2},${height/2-20})" opacity="0.25">
      <path d="M0,-50 L30,15 L18,15 L38,50 L-38,50 L-18,15 L-30,15 Z" fill="white"/>
      <rect x="-6" y="50" width="12" height="18" fill="white" rx="2"/>
      <path d="M60,-20 L80,30 L70,30 L85,55 L35,55 L50,30 L40,30 Z" fill="white" opacity="0.6"/>
    </g>
    <text x="${width/2}" y="${height - 20}" text-anchor="middle" fill="white" opacity="0.4" font-family="sans-serif" font-size="14" font-weight="600">Tennessee State Park</text>
  </svg>`;

  await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toFile(join('public/images', filename));
  console.log('Created: ' + filename);
}

mkdirSync('public/images', { recursive: true });
await createPlaceholder('park-placeholder.jpg', 800, 450, '#2D5016', '#1a3a0a');
await createPlaceholder('trail-placeholder.jpg', 800, 450, '#4a6741', '#2d4a25');
console.log('Done');
