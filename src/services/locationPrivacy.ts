/**
 * ForageWise — Location Privacy Service
 *
 * Provides GPS coordinate fuzzing for public community posts.
 * Private posts keep exact coordinates; public posts get a random
 * offset of approximately ±0.01 degrees (~1 km) to protect user privacy.
 */

import type { Coordinates } from '@/types';

/** Maximum offset in degrees (~1 km at mid-latitudes). */
export const FUZZ_OFFSET = 0.01;

/**
 * Add a random offset to GPS coordinates for privacy.
 *
 * The offset is uniformly distributed in the range [-FUZZ_OFFSET, +FUZZ_OFFSET]
 * for both latitude and longitude, producing a roughly circular fuzzing zone
 * of ~1 km radius.
 *
 * @param coords - The exact GPS coordinates.
 * @param rng - Optional random number generator (0–1). Defaults to Math.random.
 *              Useful for deterministic testing.
 * @returns A new Coordinates object with fuzzed lat/lng.
 */
export function fuzzCoordinates(
  coords: Coordinates,
  rng: () => number = Math.random,
): Coordinates {
  const latOffset = (rng() * 2 - 1) * FUZZ_OFFSET;
  const lngOffset = (rng() * 2 - 1) * FUZZ_OFFSET;

  return {
    lat: coords.lat + latOffset,
    lng: coords.lng + lngOffset,
  };
}

/**
 * Apply location privacy rules based on visibility.
 *
 * - Private posts: return exact coordinates unchanged.
 * - Public posts: return fuzzed coordinates.
 * - If coordinates are undefined, return undefined.
 *
 * @param coords - The original GPS coordinates (may be undefined).
 * @param visibility - 'private' or 'public'.
 * @param rng - Optional random number generator for testing.
 * @returns Coordinates (fuzzed or exact) or undefined.
 */
export function applyLocationPrivacy(
  coords: Coordinates | undefined,
  visibility: 'private' | 'public',
  rng?: () => number,
): Coordinates | undefined {
  if (!coords) return undefined;
  if (visibility === 'private') return coords;
  return fuzzCoordinates(coords, rng);
}
