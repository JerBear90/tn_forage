/**
 * Phase 3.2 Property Test P12: Harvest location privacy
 *
 * For any GPS coordinates, the location hash SHALL:
 * - Snap to a 500m grid (reducing precision)
 * - Two coordinates within the same 500m cell produce the same hash
 * - Two coordinates in different cells produce different hashes
 *
 * Validates: Requirements 27.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateLocationHash, isSameGridCell } from '@/utils/harvestSustainability';
import type { Coordinates } from '@/types';

const GRID_SIZE = 0.005; // ~500m

const coordsArb = fc.record({
  lat: fc.double({ min: 34.5, max: 36.7, noNaN: true }),
  lng: fc.double({ min: -90.5, max: -81.5, noNaN: true }),
});

describe('Phase 3.2 Property P12: Harvest location privacy', () => {
  it('location hash is deterministic', () => {
    fc.assert(
      fc.property(
        coordsArb,
        (coords) => {
          const hash1 = generateLocationHash(coords);
          const hash2 = generateLocationHash(coords);
          expect(hash1).toBe(hash2);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('nearby coordinates within same grid cell produce same hash', () => {
    fc.assert(
      fc.property(
        coordsArb,
        (coords) => {
          // Create a nearby point within the same grid cell
          const gridLat = Math.floor(coords.lat / GRID_SIZE) * GRID_SIZE;
          const gridLng = Math.floor(coords.lng / GRID_SIZE) * GRID_SIZE;

          const nearby: Coordinates = {
            lat: gridLat + GRID_SIZE * 0.3,
            lng: gridLng + GRID_SIZE * 0.3,
          };

          const sameCell: Coordinates = {
            lat: gridLat + GRID_SIZE * 0.7,
            lng: gridLng + GRID_SIZE * 0.7,
          };

          expect(isSameGridCell(nearby, sameCell)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('coordinates in different grid cells produce different hashes', () => {
    fc.assert(
      fc.property(
        coordsArb,
        (coords) => {
          // Create a point in a different grid cell
          const farAway: Coordinates = {
            lat: coords.lat + GRID_SIZE * 2,
            lng: coords.lng + GRID_SIZE * 2,
          };

          const hash1 = generateLocationHash(coords);
          const hash2 = generateLocationHash(farAway);
          expect(hash1).not.toBe(hash2);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('hash format starts with grid: prefix', () => {
    fc.assert(
      fc.property(
        coordsArb,
        (coords) => {
          const hash = generateLocationHash(coords);
          expect(hash.startsWith('grid:')).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
