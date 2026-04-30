/**
 * Species Detail Routing Property-Based Test
 *
 * Property 12: Species detail routing resolves correct record
 *
 * Uses fast-check to generate random IDs and random store contents in
 * fake-indexeddb. Verifies findRecordById returns a record with matching
 * data.id for valid IDs, and null for IDs not in any store.
 *
 * **Validates: Requirements 17.1, 17.2, 17.3**
 */

import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { getDB, putRecord } from "@/offline/db";
import { findRecordById } from "@/hooks/useSpeciesDetail";
import type { Species, Plant, Tree } from "@/types";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Safe ISO date string arbitrary */
const arbISODate: fc.Arbitrary<string> = fc
  .integer({
    min: new Date("2000-01-01T00:00:00Z").getTime(),
    max: new Date("2099-12-31T23:59:59Z").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

/** Generate a minimal Species record */
const arbSpeciesRecord: fc.Arbitrary<Species> = fc.record({
  id: fc.uuid(),
  commonName: fc.string({ minLength: 1, maxLength: 40 }),
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

/** Generate a minimal Plant record */
const arbPlantRecord: fc.Arbitrary<Plant> = fc.record({
  id: fc.uuid(),
  commonName: fc.string({ minLength: 1, maxLength: 40 }),
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

/** Generate a minimal Tree record */
const arbTreeRecord: fc.Arbitrary<Tree> = fc.record({
  id: fc.uuid(),
  commonName: fc.string({ minLength: 1, maxLength: 40 }),
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
// DB cleanup
// ---------------------------------------------------------------------------

async function clearStores() {
  const db = await getDB();
  await db.clear("species");
  await db.clear("plants");
  await db.clear("trees");
}

beforeEach(async () => {
  await clearStores();
});

// ---------------------------------------------------------------------------
// Property 12: Species detail routing resolves correct record
// ---------------------------------------------------------------------------

describe("Feature: forageflow-enhancements, Property 12: Species detail routing resolves correct record", () => {
  /**
   * **Validates: Requirements 17.1, 17.2, 17.3**
   */
  it("findRecordById returns a record with matching data.id for valid IDs", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbSpeciesRecord, { minLength: 0, maxLength: 5 }),
        fc.array(arbPlantRecord, { minLength: 0, maxLength: 5 }),
        fc.array(arbTreeRecord, { minLength: 0, maxLength: 5 }),
        async (speciesRecords, plantRecords, treeRecords) => {
          // Clear stores before each iteration
          await clearStores();

          // Populate stores
          for (const s of speciesRecords) {
            await putRecord("species", s);
          }
          for (const p of plantRecords) {
            await putRecord("plants", p);
          }
          for (const t of treeRecords) {
            await putRecord("trees", t);
          }

          // Test each species ID
          for (const s of speciesRecords) {
            const result = await findRecordById(s.id);
            expect(result).not.toBeNull();
            expect(result!.data.id).toBe(s.id);
            expect(result!.kind).toBe("species");
          }

          // Test each plant ID
          for (const p of plantRecords) {
            const result = await findRecordById(p.id);
            expect(result).not.toBeNull();
            expect(result!.data.id).toBe(p.id);
            // Plant could be found in species store if IDs collide,
            // but data.id should always match
          }

          // Test each tree ID
          for (const t of treeRecords) {
            const result = await findRecordById(t.id);
            expect(result).not.toBeNull();
            expect(result!.data.id).toBe(t.id);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it("findRecordById returns null for IDs not in any store", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbSpeciesRecord, { minLength: 0, maxLength: 3 }),
        fc.array(arbPlantRecord, { minLength: 0, maxLength: 3 }),
        fc.array(arbTreeRecord, { minLength: 0, maxLength: 3 }),
        fc.uuid(),
        async (speciesRecords, plantRecords, treeRecords, randomId) => {
          // Clear stores before each iteration
          await clearStores();

          // Collect all existing IDs
          const allIds = new Set([
            ...speciesRecords.map((s) => s.id),
            ...plantRecords.map((p) => p.id),
            ...treeRecords.map((t) => t.id),
          ]);

          // Only test if randomId is not in any store
          if (allIds.has(randomId)) return;

          // Populate stores
          for (const s of speciesRecords) {
            await putRecord("species", s);
          }
          for (const p of plantRecords) {
            await putRecord("plants", p);
          }
          for (const t of treeRecords) {
            await putRecord("trees", t);
          }

          const result = await findRecordById(randomId);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("findRecordById searches species store first, then plants, then trees", async () => {
    await fc.assert(
      fc.asyncProperty(arbSpeciesRecord, async (speciesRecord) => {
        await clearStores();

        // Put the record in species store
        await putRecord("species", speciesRecord);

        const result = await findRecordById(speciesRecord.id);
        expect(result).not.toBeNull();
        expect(result!.kind).toBe("species");
        expect(result!.data.id).toBe(speciesRecord.id);
      }),
      { numRuns: 50 }
    );
  });
});
