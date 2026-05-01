/**
 * Seed Record Field Completeness — Property-Based Test
 *
 * Feature: phase3-enhancements, Property 1: Seed record field completeness
 *
 * For any species record in speciesSeed or plant record in plantsSeed,
 * all required fields shall be present and non-empty, and the regions
 * array shall contain only valid TnRegion values.
 *
 * **Validates: Requirements 1.2, 1.4, 2.2, 2.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { speciesSeed } from '@/data/speciesSeed';
import { plantsSeed } from '@/data/plantsSeed';

const VALID_TN_REGIONS = ['East TN', 'Middle TN', 'West TN'];

describe('Feature: phase3-enhancements, Property 1: Seed record field completeness', () => {
  // -------------------------------------------------------------------------
  // Species seed records
  // -------------------------------------------------------------------------
  describe('speciesSeed field completeness', () => {
    it('every species record has all required fields present and non-empty', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...speciesSeed),
          (species) => {
            // String fields — present and non-empty
            expect(species.id.trim().length).toBeGreaterThan(0);
            expect(species.commonName.trim().length).toBeGreaterThan(0);
            expect(species.scientificName.trim().length).toBeGreaterThan(0);
            expect(species.category.trim().length).toBeGreaterThan(0);
            expect(species.habitat.trim().length).toBeGreaterThan(0);
            expect(species.region.trim().length).toBeGreaterThan(0);
            expect(species.edibilityLabel.trim().length).toBeGreaterThan(0);
            expect(species.safetyNotes.trim().length).toBeGreaterThan(0);
            expect(species.lastUpdated.trim().length).toBeGreaterThan(0);

            // sporePrint — required for species per task spec
            expect(species.sporePrint).toBeDefined();
            expect(typeof species.sporePrint).toBe('string');
            expect(species.sporePrint!.trim().length).toBeGreaterThan(0);

            // Array fields — present and non-empty
            expect(species.images.length).toBeGreaterThan(0);
            expect(species.season.length).toBeGreaterThan(0);
            expect(species.identificationSteps.length).toBeGreaterThan(0);
            expect(species.sources.length).toBeGreaterThan(0);

            // treeAssociations — must be an array (can be empty for lawn/meadow species)
            expect(Array.isArray(species.treeAssociations)).toBe(true);

            // lookalikes and toxicLookalikes — must be arrays (can be empty)
            expect(Array.isArray(species.lookalikes)).toBe(true);
            expect(Array.isArray(species.toxicLookalikes)).toBe(true);

            // regions — must be present, non-empty, and contain only valid TnRegion values
            expect(species.regions).toBeDefined();
            expect(Array.isArray(species.regions)).toBe(true);
            expect(species.regions!.length).toBeGreaterThan(0);
            for (const region of species.regions!) {
              expect(VALID_TN_REGIONS).toContain(region);
            }
          },
        ),
        { numRuns: speciesSeed.length },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Plant seed records
  // -------------------------------------------------------------------------
  describe('plantsSeed field completeness', () => {
    it('every plant record has all required fields present and non-empty', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...plantsSeed),
          (plant) => {
            // String fields — present and non-empty
            expect(plant.id.trim().length).toBeGreaterThan(0);
            expect(plant.commonName.trim().length).toBeGreaterThan(0);
            expect(plant.scientificName.trim().length).toBeGreaterThan(0);
            expect(plant.category.trim().length).toBeGreaterThan(0);
            expect(plant.habitat.trim().length).toBeGreaterThan(0);
            expect(plant.region.trim().length).toBeGreaterThan(0);
            expect(plant.edibilityLabel.trim().length).toBeGreaterThan(0);
            expect(plant.safetyNotes.trim().length).toBeGreaterThan(0);
            expect(plant.lastUpdated.trim().length).toBeGreaterThan(0);

            // Array fields — present and non-empty
            expect(plant.images.length).toBeGreaterThan(0);
            expect(plant.season.length).toBeGreaterThan(0);
            expect(plant.identificationSteps.length).toBeGreaterThan(0);
            expect(plant.sources.length).toBeGreaterThan(0);

            // treeAssociations — must be an array (can be empty for species without tree associations)
            expect(Array.isArray(plant.treeAssociations)).toBe(true);

            // lookalikes and toxicLookalikes — must be arrays (can be empty)
            expect(Array.isArray(plant.lookalikes)).toBe(true);
            expect(Array.isArray(plant.toxicLookalikes)).toBe(true);

            // regions — must be present, non-empty, and contain only valid TnRegion values
            expect(plant.regions).toBeDefined();
            expect(Array.isArray(plant.regions)).toBe(true);
            expect(plant.regions!.length).toBeGreaterThan(0);
            for (const region of plant.regions!) {
              expect(VALID_TN_REGIONS).toContain(region);
            }
          },
        ),
        { numRuns: plantsSeed.length },
      );
    });
  });
});

// Feature: phase3-enhancements, Property 2: Toxic lookalike completeness
/**
 * Toxic Lookalike Completeness — Property-Based Test
 *
 * Feature: phase3-enhancements, Property 2: Toxic lookalike completeness
 *
 * For any species or plant record that has a non-empty toxicLookalikes array,
 * every entry in that array shall have a non-empty speciesId, a non-empty
 * commonName, isToxic set to true, and a non-empty differentiatingFeatures string.
 *
 * **Validates: Requirements 1.3, 2.3, 18.4**
 */
describe('Feature: phase3-enhancements, Property 2: Toxic lookalike completeness', () => {
  // Filter to only records that have non-empty toxicLookalikes
  const speciesWithToxicLookalikes = speciesSeed.filter(
    (s) => s.toxicLookalikes.length > 0,
  );
  const plantsWithToxicLookalikes = plantsSeed.filter(
    (p) => p.toxicLookalikes.length > 0,
  );

  // -------------------------------------------------------------------------
  // Species toxic lookalikes
  // -------------------------------------------------------------------------
  describe('speciesSeed toxic lookalike completeness', () => {
    it('every toxic lookalike entry has speciesId, commonName, isToxic: true, and differentiatingFeatures', () => {
      // Guard: ensure we actually have species with toxic lookalikes to test
      expect(speciesWithToxicLookalikes.length).toBeGreaterThan(0);

      fc.assert(
        fc.property(
          fc.constantFrom(...speciesWithToxicLookalikes),
          (species) => {
            for (const lookalike of species.toxicLookalikes) {
              // speciesId — non-empty string
              expect(typeof lookalike.speciesId).toBe('string');
              expect(lookalike.speciesId.trim().length).toBeGreaterThan(0);

              // commonName — non-empty string
              expect(typeof lookalike.commonName).toBe('string');
              expect(lookalike.commonName.trim().length).toBeGreaterThan(0);

              // isToxic — must be true
              expect(lookalike.isToxic).toBe(true);

              // differentiatingFeatures — non-empty string
              expect(typeof lookalike.differentiatingFeatures).toBe('string');
              expect(lookalike.differentiatingFeatures.trim().length).toBeGreaterThan(0);
            }
          },
        ),
        { numRuns: speciesWithToxicLookalikes.length },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Plant toxic lookalikes
  // -------------------------------------------------------------------------
  describe('plantsSeed toxic lookalike completeness', () => {
    it('every toxic lookalike entry has speciesId, commonName, isToxic: true, and differentiatingFeatures', () => {
      // Guard: ensure we actually have plants with toxic lookalikes to test
      expect(plantsWithToxicLookalikes.length).toBeGreaterThan(0);

      fc.assert(
        fc.property(
          fc.constantFrom(...plantsWithToxicLookalikes),
          (plant) => {
            for (const lookalike of plant.toxicLookalikes) {
              // speciesId — non-empty string
              expect(typeof lookalike.speciesId).toBe('string');
              expect(lookalike.speciesId.trim().length).toBeGreaterThan(0);

              // commonName — non-empty string
              expect(typeof lookalike.commonName).toBe('string');
              expect(lookalike.commonName.trim().length).toBeGreaterThan(0);

              // isToxic — must be true
              expect(lookalike.isToxic).toBe(true);

              // differentiatingFeatures — non-empty string
              expect(typeof lookalike.differentiatingFeatures).toBe('string');
              expect(lookalike.differentiatingFeatures.trim().length).toBeGreaterThan(0);
            }
          },
        ),
        { numRuns: plantsWithToxicLookalikes.length },
      );
    });
  });
});

// Feature: phase3-enhancements, Property 3: Seed image path locality
/**
 * Seed Image Path Locality — Property-Based Test
 *
 * Feature: phase3-enhancements, Property 3: Seed image path locality
 *
 * For any species record in speciesSeed, every entry in its images array
 * shall start with `/images/species/`. For any plant record in plantsSeed,
 * every entry in its images array shall start with `/images/plants/`.
 *
 * **Validates: Requirements 1.5, 2.5**
 */
describe('Feature: phase3-enhancements, Property 3: Seed image path locality', () => {
  // -------------------------------------------------------------------------
  // Species seed image paths
  // -------------------------------------------------------------------------
  describe('speciesSeed image path locality', () => {
    it('every species image path starts with /images/species/', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...speciesSeed),
          (species) => {
            expect(species.images.length).toBeGreaterThan(0);
            for (const imagePath of species.images) {
              expect(imagePath).toMatch(/^\/images\/species\//);
            }
          },
        ),
        { numRuns: speciesSeed.length },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Plant seed image paths
  // -------------------------------------------------------------------------
  describe('plantsSeed image path locality', () => {
    it('every plant image path starts with /images/plants/', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...plantsSeed),
          (plant) => {
            expect(plant.images.length).toBeGreaterThan(0);
            for (const imagePath of plant.images) {
              expect(imagePath).toMatch(/^\/images\/plants\//);
            }
          },
        ),
        { numRuns: plantsSeed.length },
      );
    });
  });
});

// Feature: phase3-enhancements, Property 5: Park image non-placeholder
/**
 * Park Image Non-Placeholder — Property-Based Test
 *
 * Feature: phase3-enhancements, Property 5: Park image non-placeholder
 *
 * For any park record in parksSeed, the `image` field shall not equal
 * `/images/park-placeholder.jpg` and shall start with `/images/parks/`.
 *
 * **Validates: Requirements 3.5**
 */
import { parksSeed } from '@/data/parksSeed';

describe('Feature: phase3-enhancements, Property 5: Park image non-placeholder', () => {
  it('every park record has a non-placeholder image starting with /images/parks/', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...parksSeed),
        (park) => {
          // image must not be the placeholder
          expect(park.image).not.toBe('/images/park-placeholder.jpg');

          // image must start with /images/parks/
          expect(park.image).toMatch(/^\/images\/parks\//);
        },
      ),
      { numRuns: parksSeed.length },
    );
  });
});
