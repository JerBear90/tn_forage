/**
 * Seed Data Record Completeness — Property-Based Test
 *
 * Property 1: Seed data record completeness
 *
 * Verifies that every record in the seed data arrays has all required
 * fields populated with valid values. Uses fast-check to iterate over
 * the actual seed arrays and assert invariants on each record.
 *
 * **Validates: Requirements 1.4, 1.5, 1.6, 1.7**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parksSeed } from '@/data/parksSeed';
import { trailsSeed } from '@/data/trailsSeed';
import { treesSeed } from '@/data/treesSeed';
import { speciesSeed } from '@/data/speciesSeed';
import { plantsSeed } from '@/data/plantsSeed';

// Tennessee geographic bounds
const TN_LAT_MIN = 34.9;
const TN_LAT_MAX = 36.7;
const TN_LNG_MIN = -90.4;
const TN_LNG_MAX = -81.6;

const VALID_REGIONS = ['East TN', 'Middle TN', 'West TN'];
const VALID_DIFFICULTIES = ['easy', 'moderate', 'hard', 'expert'];

// Build a set of valid park IDs for trail validation
const validParkIds = new Set(parksSeed.map((p) => p.id));

describe('Feature: foragewise-enhancements, Property 1: Seed data record completeness', () => {
  // -------------------------------------------------------------------------
  // Parks
  // -------------------------------------------------------------------------
  describe('parksSeed completeness', () => {
    it('every park has non-empty name, valid region, valid TN coordinates, non-empty amenities, non-empty foragingRules, and valid sourceUrl', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...parksSeed),
          (park) => {
            // Non-empty name
            expect(park.name.trim().length).toBeGreaterThan(0);

            // Valid region
            expect(VALID_REGIONS).toContain(park.region);

            // Valid TN coordinates
            expect(park.coordinates.lat).toBeGreaterThanOrEqual(TN_LAT_MIN);
            expect(park.coordinates.lat).toBeLessThanOrEqual(TN_LAT_MAX);
            expect(park.coordinates.lng).toBeGreaterThanOrEqual(TN_LNG_MIN);
            expect(park.coordinates.lng).toBeLessThanOrEqual(TN_LNG_MAX);

            // Non-empty amenities
            expect(park.amenities.length).toBeGreaterThan(0);

            // Non-empty foragingRules
            expect(park.foragingRules.trim().length).toBeGreaterThan(0);

            // Valid sourceUrl
            expect(park.sourceUrl).toBeDefined();
            expect(park.sourceUrl!.startsWith('http')).toBe(true);
          },
        ),
        { numRuns: parksSeed.length },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Trails
  // -------------------------------------------------------------------------
  describe('trailsSeed completeness', () => {
    it('every trail has non-empty name, valid parkId, positive distance, valid difficulty, non-empty coordinates, and sourceUrl', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...trailsSeed),
          (trail) => {
            // Non-empty name
            expect(trail.name.trim().length).toBeGreaterThan(0);

            // Valid parkId referencing an existing park
            expect(validParkIds.has(trail.parkId)).toBe(true);

            // Positive distance
            expect(trail.distance).toBeGreaterThan(0);

            // Valid difficulty
            expect(VALID_DIFFICULTIES).toContain(trail.difficulty);

            // Non-empty coordinates
            expect(trail.coordinates.length).toBeGreaterThan(0);

            // sourceUrl
            expect(trail.sourceUrl).toBeDefined();
            expect(trail.sourceUrl!.startsWith('http')).toBe(true);
          },
        ),
        { numRuns: trailsSeed.length },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Trees
  // -------------------------------------------------------------------------
  describe('treesSeed completeness', () => {
    it('every tree has non-empty commonName, scientificName, habitat, barkDescription, leafDescription, shapeDescription, and sourceUrl', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...treesSeed),
          (tree) => {
            // Non-empty required string fields
            expect(tree.commonName.trim().length).toBeGreaterThan(0);
            expect(tree.scientificName.trim().length).toBeGreaterThan(0);
            expect(tree.habitat.trim().length).toBeGreaterThan(0);
            expect(tree.barkDescription.trim().length).toBeGreaterThan(0);
            expect(tree.leafDescription.trim().length).toBeGreaterThan(0);
            expect(tree.shapeDescription.trim().length).toBeGreaterThan(0);

            // sourceUrl
            expect(tree.sourceUrl).toBeDefined();
            expect(tree.sourceUrl!.startsWith('http')).toBe(true);
          },
        ),
        { numRuns: treesSeed.length },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Species — image URLs
  // -------------------------------------------------------------------------
  describe('speciesSeed image completeness', () => {
    it('every species has at least one image URL starting with http or /images/', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...speciesSeed),
          (species) => {
            expect(species.images.length).toBeGreaterThan(0);
            const hasValidImage = species.images.some(
              (url) => url.startsWith('http') || url.startsWith('/images/'),
            );
            expect(hasValidImage).toBe(true);
          },
        ),
        { numRuns: speciesSeed.length },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Plants — image URLs
  // -------------------------------------------------------------------------
  describe('plantsSeed image completeness', () => {
    it('every plant has at least one image URL starting with http or /images/', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...plantsSeed),
          (plant) => {
            expect(plant.images.length).toBeGreaterThan(0);
            const hasValidImage = plant.images.some(
              (url) => url.startsWith('http') || url.startsWith('/images/'),
            );
            expect(hasValidImage).toBe(true);
          },
        ),
        { numRuns: plantsSeed.length },
      );
    });
  });
});
