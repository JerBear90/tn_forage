/**
 * Associated Species Link Resolution Property-Based Test
 *
 * Property 7: Associated species link resolution
 *
 * Uses fast-check to generate random tree records with associatedSpecies arrays
 * and random species/plant stores. Verifies the resolution function returns a
 * valid ID for names with a match and null for names with no match.
 *
 * **Validates: Requirements 12.1, 12.3**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { resolveAssociatedSpecies } from "@/hooks/useAssociatedSpeciesLookup";
import type { Species, Plant, Tree } from "@/types";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generate a random common name */
const arbCommonName: fc.Arbitrary<string> = fc.string({
  minLength: 1,
  maxLength: 40,
});

/** Safe ISO date string arbitrary */
const arbISODate: fc.Arbitrary<string> = fc
  .integer({
    min: new Date("2000-01-01T00:00:00Z").getTime(),
    max: new Date("2099-12-31T23:59:59Z").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

/** Generate a minimal Species record for lookup testing */
const arbSpeciesRecord: fc.Arbitrary<Species> = fc.record({
  id: fc.uuid(),
  commonName: arbCommonName,
  scientificName: fc.string({ minLength: 1, maxLength: 40 }),
  category: fc.constant("mushroom" as const),
  images: fc.constant([]),
  habitat: fc.constant("forest"),
  treeAssociations: fc.constant([]),
  season: fc.constant([]),
  region: fc.constant("East TN"),
  identificationSteps: fc.constant([]),
  lookalikes: fc.constant([]),
  toxicLookalikes: fc.constant([]),
  edibilityLabel: fc.constant("unknown" as const),
  safetyNotes: fc.constant("Verify with expert"),
  sources: fc.constant([]),
  lastUpdated: arbISODate,
});

/** Generate a minimal Plant record for lookup testing */
const arbPlantRecord: fc.Arbitrary<Plant> = fc.record({
  id: fc.uuid(),
  commonName: arbCommonName,
  scientificName: fc.string({ minLength: 1, maxLength: 40 }),
  category: fc.constant("plant" as const),
  images: fc.constant([]),
  habitat: fc.constant("meadow"),
  treeAssociations: fc.constant([]),
  season: fc.constant([]),
  region: fc.constant("Middle TN"),
  identificationSteps: fc.constant([]),
  lookalikes: fc.constant([]),
  toxicLookalikes: fc.constant([]),
  edibilityLabel: fc.constant("unknown" as const),
  safetyNotes: fc.constant("Verify with expert"),
  sources: fc.constant([]),
  lastUpdated: arbISODate,
});

/** Generate a minimal Tree record for lookup testing */
const arbTreeRecord: fc.Arbitrary<Tree> = fc.record({
  id: fc.uuid(),
  commonName: arbCommonName,
  scientificName: fc.string({ minLength: 1, maxLength: 40 }),
  images: fc.constant([]),
  habitat: fc.constant("forest"),
  barkDescription: fc.constant("rough"),
  leafDescription: fc.constant("broad"),
  shapeDescription: fc.constant("tall"),
  associatedSpecies: fc.constant([]),
  region: fc.constant("West TN"),
  lastUpdated: arbISODate,
});

// ---------------------------------------------------------------------------
// Property 7: Associated species link resolution
// ---------------------------------------------------------------------------

describe("Feature: foragewise-enhancements, Property 7: Associated species link resolution", () => {
  /**
   * **Validates: Requirements 12.1, 12.3**
   */
  it("returns a valid ID for names with a match and null for names with no match", () => {
    fc.assert(
      fc.property(
        fc.array(arbSpeciesRecord, { minLength: 0, maxLength: 10 }),
        fc.array(arbPlantRecord, { minLength: 0, maxLength: 10 }),
        fc.array(arbTreeRecord, { minLength: 0, maxLength: 10 }),
        fc.array(arbCommonName, { minLength: 0, maxLength: 15 }),
        (speciesRecords, plantRecords, treeRecords, queryNames) => {
          const result = resolveAssociatedSpecies(
            queryNames,
            speciesRecords,
            plantRecords,
            treeRecords
          );

          // Build the same lookup map the function uses
          const lookupMap = new Map<string, string>();
          const allRecords: Array<{ commonName: string; id: string }> = [];

          for (const s of speciesRecords) {
            lookupMap.set(s.commonName.toLowerCase(), s.id);
            allRecords.push({ commonName: s.commonName, id: s.id });
          }
          for (const p of plantRecords) {
            lookupMap.set(p.commonName.toLowerCase(), p.id);
            allRecords.push({ commonName: p.commonName, id: p.id });
          }
          for (const t of treeRecords) {
            lookupMap.set(t.commonName.toLowerCase(), t.id);
            allRecords.push({ commonName: t.commonName, id: t.id });
          }

          for (const name of queryNames) {
            const key = name.toLowerCase();
            const exactId = lookupMap.get(key) ?? null;

            if (exactId !== null) {
              // Name has an exact match → result should be that ID
              expect(result[name]).toBe(exactId);
              expect(typeof result[name]).toBe("string");
            } else {
              // No exact match — check for partial word-boundary match
              const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              let partialRegexValid = true;
              let partialMatch: { id: string } | undefined;
              try {
                const wordBoundaryRegex = new RegExp('\\b' + escapedKey + '\\b', 'i');
                partialMatch = allRecords.find((r) => wordBoundaryRegex.test(r.commonName));
              } catch {
                // Invalid regex — function would also fail, treat as no match
                partialRegexValid = false;
              }

              if (partialRegexValid && partialMatch) {
                // Partial match found → result should be that ID
                expect(result[name]).toBe(partialMatch.id);
              } else {
                // No match at all → result should be null
                expect(result[name]).toBeNull();
              }
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it("resolution is case-insensitive", () => {
    fc.assert(
      fc.property(
        arbSpeciesRecord,
        (speciesRecord) => {
          const upperName = speciesRecord.commonName.toUpperCase();
          const lowerName = speciesRecord.commonName.toLowerCase();
          const mixedName =
            speciesRecord.commonName.charAt(0).toUpperCase() +
            speciesRecord.commonName.slice(1).toLowerCase();

          const result = resolveAssociatedSpecies(
            [upperName, lowerName, mixedName],
            [speciesRecord],
            [],
            []
          );

          // All case variants should resolve to the same ID
          expect(result[upperName]).toBe(speciesRecord.id);
          expect(result[lowerName]).toBe(speciesRecord.id);
          expect(result[mixedName]).toBe(speciesRecord.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns null for all names when stores are empty", () => {
    fc.assert(
      fc.property(
        fc.array(arbCommonName, { minLength: 1, maxLength: 10 }),
        (names) => {
          const result = resolveAssociatedSpecies(names, [], [], []);

          for (const name of names) {
            expect(result[name]).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
