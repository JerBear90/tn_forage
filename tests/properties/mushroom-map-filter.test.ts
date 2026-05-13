/**
 * Mushroom Map Filter — Property-Based Tests
 *
 * Feature: season-charts-voice-map, Property 5: Mushroom location filtering
 *
 * For any set of trails with varying `likelySpecies` arrays and a known set
 * of mushroom species IDs, the mushroom map layer SHALL produce markers only
 * for trails whose `likelySpecies` array contains at least one mushroom
 * species ID. Parks SHALL receive markers only if at least one of their
 * trails qualifies. No trail or park without mushroom species in
 * `likelySpecies` SHALL receive a marker.
 *
 * **Validates: Requirements 5.2, 5.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  filterMushroomTrails,
  buildMarkers,
} from '@/hooks/useMushroomMapData';
import type { Trail, Park, Species } from '@/types';
import type { MonthIndex } from '@/utils/seasonHelpers';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const ALL_SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

/** Arbitrary species ID string */
const arbSpeciesId = fc.stringMatching(/^sp-[a-z]{3,8}$/);

/** Arbitrary non-mushroom species ID string */
const arbNonMushroomId = fc.stringMatching(/^pl-[a-z]{3,8}$/);

/** Arbitrary coordinate */
const arbCoordinate = fc.record({
  lat: fc.double({ min: 35, max: 37, noNaN: true }),
  lng: fc.double({ min: -90, max: -82, noNaN: true }),
});

/** Arbitrary month index */
const arbMonth: fc.Arbitrary<MonthIndex> = fc.integer({ min: 0, max: 11 }) as fc.Arbitrary<MonthIndex>;

/**
 * Generate a test scenario with:
 * - A set of mushroom species IDs
 * - A set of non-mushroom species IDs
 * - Trails with varying likelySpecies (mix of mushroom and non-mushroom)
 * - Parks that own those trails
 */
const arbScenario = fc.record({
  mushroomIds: fc.uniqueArray(arbSpeciesId, { minLength: 1, maxLength: 5 }),
  nonMushroomIds: fc.uniqueArray(arbNonMushroomId, { minLength: 0, maxLength: 5 }),
}).chain(({ mushroomIds, nonMushroomIds }) => {
  const allIds = [...mushroomIds, ...nonMushroomIds];

  // Generate park IDs
  const arbParkId = fc.stringMatching(/^park-[a-z]{3,8}$/);

  return fc.record({
    mushroomIds: fc.constant(mushroomIds),
    nonMushroomIds: fc.constant(nonMushroomIds),
    parkIds: fc.uniqueArray(arbParkId, { minLength: 1, maxLength: 4 }),
  }).chain(({ mushroomIds: mIds, nonMushroomIds: nmIds, parkIds }) => {
    // Generate trails assigned to random parks with random likelySpecies
    const arbTrail = fc.record({
      id: fc.uuid(),
      parkId: fc.constantFrom(...parkIds),
      name: fc.string({ minLength: 1, maxLength: 20 }),
      distance: fc.double({ min: 0.1, max: 20, noNaN: true }),
      difficulty: fc.constantFrom('easy' as const, 'moderate' as const, 'hard' as const, 'expert' as const),
      coordinates: fc.array(arbCoordinate, { minLength: 1, maxLength: 3 }),
      likelySpecies: fc.subarray(allIds, { minLength: 0, maxLength: allIds.length }),
      likelyTrees: fc.constant([] as string[]),
      images: fc.constant([] as string[]),
      lastUpdated: fc.constant('2024-01-01'),
    });

    return fc.record({
      mushroomIds: fc.constant(mIds),
      nonMushroomIds: fc.constant(nmIds),
      parkIds: fc.constant(parkIds),
      trails: fc.array(arbTrail, { minLength: 1, maxLength: 10 }),
      currentMonth: arbMonth,
    });
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build minimal Park objects from park IDs */
function buildParks(parkIds: string[]): Park[] {
  return parkIds.map((id) => ({
    id,
    name: `Park ${id}`,
    region: 'East TN',
    coordinates: { lat: 36.0, lng: -86.0 },
    amenities: [],
    trails: [],
    foragingRules: 'Follow park rules',
    lastUpdated: '2024-01-01',
  }));
}

/** Build a Species map from mushroom IDs */
function buildSpeciesMap(
  mushroomIds: string[],
  nonMushroomIds: string[],
): Map<string, Species> {
  const map = new Map<string, Species>();

  for (const id of mushroomIds) {
    map.set(id, {
      id,
      commonName: `Mushroom ${id}`,
      scientificName: `Fungus ${id}`,
      category: 'mushroom',
      images: [],
      habitat: 'forest',
      treeAssociations: [],
      season: ['Spring', 'Fall'],
      region: 'East TN',
      identificationSteps: [],
      lookalikes: [],
      toxicLookalikes: [],
      edibilityLabel: 'unknown',
      safetyNotes: 'Verify with expert',
      sources: [],
      lastUpdated: '2024-01-01',
    });
  }

  for (const id of nonMushroomIds) {
    map.set(id, {
      id,
      commonName: `Plant ${id}`,
      scientificName: `Plantus ${id}`,
      category: 'plant',
      images: [],
      habitat: 'meadow',
      treeAssociations: [],
      season: ['Summer'],
      region: 'Middle TN',
      identificationSteps: [],
      lookalikes: [],
      toxicLookalikes: [],
      edibilityLabel: 'unknown',
      safetyNotes: 'Verify with expert',
      sources: [],
      lastUpdated: '2024-01-01',
    });
  }

  return map;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Feature: season-charts-voice-map, Property 5: Mushroom location filtering', () => {
  it('filterMushroomTrails returns only trails with at least one mushroom species', () => {
    fc.assert(
      fc.property(arbScenario, ({ mushroomIds, trails }) => {
        const mushroomSet = new Set(mushroomIds);
        const filtered = filterMushroomTrails(trails as Trail[], mushroomSet);

        // Every returned trail must have at least one mushroom species
        for (const trail of filtered) {
          const hasMushroomSpecies = trail.likelySpecies.some((id) =>
            mushroomSet.has(id),
          );
          expect(hasMushroomSpecies).toBe(true);
        }

        // Every trail with a mushroom species must be in the result
        for (const trail of trails) {
          const hasMushroomSpecies = (trail as Trail).likelySpecies.some((id) =>
            mushroomSet.has(id),
          );
          if (hasMushroomSpecies) {
            expect(filtered.some((t) => t.id === trail.id)).toBe(true);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('filterMushroomTrails excludes trails without any mushroom species', () => {
    fc.assert(
      fc.property(arbScenario, ({ mushroomIds, trails }) => {
        const mushroomSet = new Set(mushroomIds);
        const filtered = filterMushroomTrails(trails as Trail[], mushroomSet);

        // No trail without mushroom species should appear in the result
        for (const trail of trails) {
          const hasMushroomSpecies = (trail as Trail).likelySpecies.some((id) =>
            mushroomSet.has(id),
          );
          if (!hasMushroomSpecies) {
            expect(filtered.some((t) => t.id === trail.id)).toBe(false);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('buildMarkers produces park markers only when at least one trail qualifies', () => {
    fc.assert(
      fc.property(
        arbScenario,
        ({ mushroomIds, nonMushroomIds, parkIds, trails, currentMonth }) => {
          const mushroomSet = new Set(mushroomIds);
          const mushroomTrails = filterMushroomTrails(trails as Trail[], mushroomSet);
          const parks = buildParks(parkIds);
          const speciesMap = buildSpeciesMap(mushroomIds, nonMushroomIds);
          const markers = buildMarkers(mushroomTrails, parks, speciesMap, currentMonth);

          const parkMarkers = markers.filter((m) => m.type === 'park');

          // Determine which parks should have markers: parks with at least
          // one qualifying trail
          const qualifyingParkIds = new Set<string>();
          for (const trail of mushroomTrails) {
            // A trail qualifies if buildMarkers would produce a trail marker
            // (i.e., it has resolved mushroom species from the speciesMap)
            const hasResolvedMushroom = trail.likelySpecies.some((id) => {
              const sp = speciesMap.get(id);
              return sp && sp.category === 'mushroom';
            });
            if (hasResolvedMushroom) {
              qualifyingParkIds.add(trail.parkId);
            }
          }

          // Every park marker must correspond to a park with qualifying trails
          for (const marker of parkMarkers) {
            const parkId = marker.id.replace('park-', '');
            expect(qualifyingParkIds.has(parkId)).toBe(true);
          }

          // Every qualifying park that exists in the parks array should have a marker
          for (const parkId of Array.from(qualifyingParkIds)) {
            const parkExists = parks.some((p) => p.id === parkId);
            if (parkExists) {
              expect(parkMarkers.some((m) => m.id === `park-${parkId}`)).toBe(true);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('no trail marker is produced for trails without mushroom species', () => {
    fc.assert(
      fc.property(
        arbScenario,
        ({ mushroomIds, nonMushroomIds, parkIds, trails, currentMonth }) => {
          const mushroomSet = new Set(mushroomIds);
          const mushroomTrails = filterMushroomTrails(trails as Trail[], mushroomSet);
          const parks = buildParks(parkIds);
          const speciesMap = buildSpeciesMap(mushroomIds, nonMushroomIds);
          const markers = buildMarkers(mushroomTrails, parks, speciesMap, currentMonth);

          const trailMarkers = markers.filter((m) => m.type === 'trail');

          // Every trail marker must have at least one mushroom species
          for (const marker of trailMarkers) {
            expect(marker.mushroomSpecies.length).toBeGreaterThan(0);
          }

          // No trail marker should correspond to a trail that lacks mushroom species
          const nonMushroomTrailIds = Array.from(new Set(
            (trails as Trail[])
              .filter((t) => !t.likelySpecies.some((id) => mushroomSet.has(id)))
              .map((t) => t.id),
          ));

          for (const marker of trailMarkers) {
            const trailId = marker.id.replace('trail-', '');
            expect(nonMushroomTrailIds.includes(trailId)).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  }, 30000);

  it('park markers are deduplicated (one marker per park)', () => {
    fc.assert(
      fc.property(
        arbScenario,
        ({ mushroomIds, nonMushroomIds, parkIds, trails, currentMonth }) => {
          const mushroomSet = new Set(mushroomIds);
          const mushroomTrails = filterMushroomTrails(trails as Trail[], mushroomSet);
          const parks = buildParks(parkIds);
          const speciesMap = buildSpeciesMap(mushroomIds, nonMushroomIds);
          const markers = buildMarkers(mushroomTrails, parks, speciesMap, currentMonth);

          const parkMarkers = markers.filter((m) => m.type === 'park');
          const parkMarkerIds = parkMarkers.map((m) => m.id);

          // No duplicate park marker IDs
          expect(new Set(parkMarkerIds).size).toBe(parkMarkerIds.length);
        },
      ),
      { numRuns: 100 },
    );
  }, 30000);
});
