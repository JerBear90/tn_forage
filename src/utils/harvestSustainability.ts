/**
 * ForageFlow — Harvest Sustainability Calculator
 *
 * Calculates sustainability level (green/yellow/red) based on harvest
 * frequency at a given location. Implements location hashing for privacy
 * using a 500m grid to avoid storing exact coordinates.
 *
 * Requirements: 27.2, 27.3, 27.6
 */

import type { SustainabilityLevel, Coordinates } from '@/types';

/**
 * Grid size in degrees (approximately 500m at Tennessee's latitude ~36°N).
 * 1 degree latitude ≈ 111km, so 500m ≈ 0.0045 degrees.
 * 1 degree longitude at 36°N ≈ 90km, so 500m ≈ 0.0056 degrees.
 * We use a simplified uniform grid of 0.005 degrees (~500m).
 */
const GRID_SIZE_DEGREES = 0.005;

/**
 * Thresholds for sustainability levels.
 * Based on harvests per location within a 30-day rolling window.
 */
const SUSTAINABILITY_THRESHOLDS = {
  /** Green: sustainable harvesting level */
  green: 2,
  /** Yellow: approaching over-harvesting */
  yellow: 4,
  // Red: anything above yellow threshold
};

/**
 * Generates a privacy-preserving location hash by snapping coordinates
 * to a 500m grid. This prevents exact harvest locations from being stored
 * while still allowing sustainability tracking per area.
 *
 * @param coords - Exact GPS coordinates
 * @returns A string hash representing the 500m grid cell
 */
export function generateLocationHash(coords: Coordinates): string {
  const gridLat = Math.floor(coords.lat / GRID_SIZE_DEGREES) * GRID_SIZE_DEGREES;
  const gridLng = Math.floor(coords.lng / GRID_SIZE_DEGREES) * GRID_SIZE_DEGREES;

  // Round to avoid floating point issues
  const roundedLat = Math.round(gridLat * 10000) / 10000;
  const roundedLng = Math.round(gridLng * 10000) / 10000;

  return `grid:${roundedLat}:${roundedLng}`;
}

/**
 * Calculates the sustainability level for a harvest location based on
 * the number of recent harvests in the same grid cell.
 *
 * @param harvestCountInArea - Number of harvests in the same 500m grid cell within 30 days
 * @returns The sustainability level: green, yellow, or red
 */
export function calculateSustainabilityLevel(
  harvestCountInArea: number,
): SustainabilityLevel {
  if (harvestCountInArea <= SUSTAINABILITY_THRESHOLDS.green) {
    return 'green';
  }
  if (harvestCountInArea <= SUSTAINABILITY_THRESHOLDS.yellow) {
    return 'yellow';
  }
  return 'red';
}

/**
 * Gets a human-readable description for a sustainability level.
 */
export function getSustainabilityDescription(level: SustainabilityLevel): string {
  switch (level) {
    case 'green':
      return 'Sustainable — this area has not been heavily harvested recently.';
    case 'yellow':
      return 'Caution — this area has seen moderate harvesting. Consider rotating to a different location.';
    case 'red':
      return 'Over-harvested — this area has been heavily harvested recently. Allow time for recovery before harvesting here again.';
  }
}

/**
 * Determines if two coordinates fall within the same 500m grid cell.
 */
export function isSameGridCell(a: Coordinates, b: Coordinates): boolean {
  return generateLocationHash(a) === generateLocationHash(b);
}
