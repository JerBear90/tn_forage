/**
 * ForageFlow — Spore Print Color Matcher
 *
 * Client-side spore print color matching using Canvas API.
 * Extracts the dominant color from an image, calculates Euclidean RGB
 * distance against known species spore print colors, and ranks matches.
 *
 * Fully offline — no ML model needed.
 *
 * Requirements: 26.2, 26.3, 26.4
 */

import type { SporePrintMatch } from '@/types';

/**
 * Species spore print color entry for matching.
 */
export interface SporePrintEntry {
  speciesId: string;
  commonName: string;
  sporePrintColor: string; // hex color e.g. '#FFFFFF'
}

/**
 * RGB color representation.
 */
interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Converts a hex color string to RGB values.
 */
export function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return { r, g, b };
}

/**
 * Converts RGB values to a hex color string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/**
 * Calculates the Euclidean distance between two RGB colors.
 * Range: 0 (identical) to ~441.67 (black vs white).
 */
export function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) + Math.pow(a.g - b.g, 2) + Math.pow(a.b - b.b, 2),
  );
}

/**
 * Extracts the dominant color from Canvas ImageData.
 * Uses simple averaging of all non-transparent pixels.
 * For better results, could use k-means clustering, but averaging
 * works well for spore prints which are typically uniform in color.
 */
export function extractDominantColor(imageData: ImageData): RGB {
  const data = imageData.data;
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let pixelCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    // Skip transparent or near-transparent pixels
    if (alpha < 128) continue;

    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
    pixelCount++;
  }

  if (pixelCount === 0) {
    return { r: 128, g: 128, b: 128 }; // Default gray if no valid pixels
  }

  return {
    r: Math.round(totalR / pixelCount),
    g: Math.round(totalG / pixelCount),
    b: Math.round(totalB / pixelCount),
  };
}

/**
 * Matches an extracted spore print color against known species.
 * Returns the top N matches ranked by ascending color distance.
 *
 * @param extractedColor - The dominant color extracted from the user's spore print photo
 * @param speciesColors - Array of known species spore print colors
 * @param topN - Number of top matches to return (default: 5)
 * @returns Array of SporePrintMatch sorted by ascending distance (best match first)
 */
export function matchSporePrintColor(
  extractedColor: RGB,
  speciesColors: SporePrintEntry[],
  topN: number = 5,
): SporePrintMatch[] {
  const extractedHex = rgbToHex(extractedColor.r, extractedColor.g, extractedColor.b);

  const matches: SporePrintMatch[] = speciesColors.map((entry) => {
    const expectedRgb = hexToRgb(entry.sporePrintColor);
    const distance = colorDistance(extractedColor, expectedRgb);

    // Convert distance to a confidence percentage
    // Max possible distance is ~441.67 (black to white)
    const maxDistance = 441.67;
    const confidencePercent = Math.max(0, Math.round((1 - distance / maxDistance) * 100));

    return {
      speciesId: entry.speciesId,
      commonName: entry.commonName,
      expectedColor: entry.sporePrintColor,
      extractedColor: extractedHex,
      colorDistance: Math.round(distance * 100) / 100,
      confidencePercent,
    };
  });

  // Sort by ascending color distance (closest match first)
  matches.sort((a, b) => a.colorDistance - b.colorDistance);

  return matches.slice(0, topN);
}
