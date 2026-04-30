/**
 * Community Feed Preview Property-Based Test
 *
 * Property 5: Community feed preview returns most recent public sightings
 *
 * Uses fast-check to generate random lists of CommunityDraft with mixed
 * `visibility` and `createdAt` values. Verifies the filtering/sorting logic
 * returns at most 3 items, all public, sorted by createdAt descending.
 *
 * **Validates: Requirements 11.2**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { filterCommunityPreviews } from "@/hooks/useCommunityPreview";
import type { CommunityDraft, LogVisibility } from "@/types";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generate a random LogVisibility */
const arbVisibility: fc.Arbitrary<LogVisibility> = fc.constantFrom(
  "public",
  "private"
);

/**
 * Safe ISO date string arbitrary — uses integer timestamps to avoid
 * Invalid Date issues during shrinking.
 */
const arbISODate: fc.Arbitrary<string> = fc
  .integer({
    min: new Date("2000-01-01T00:00:00Z").getTime(),
    max: new Date("2099-12-31T23:59:59Z").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

/** Generate a random CommunityDraft */
const arbCommunityDraft: fc.Arbitrary<CommunityDraft> = fc.record({
  id: fc.uuid(),
  userId: fc.string({ minLength: 1, maxLength: 30 }),
  speciesGuess: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
    nil: undefined,
  }),
  photos: fc.array(fc.uuid(), { minLength: 0, maxLength: 3 }),
  coordinates: fc.option(
    fc.record({
      lat: fc.double({ min: 34.9, max: 36.7, noNaN: true }),
      lng: fc.double({ min: -90.4, max: -81.6, noNaN: true }),
    }),
    { nil: undefined }
  ),
  notes: fc.string({ minLength: 0, maxLength: 200 }),
  visibility: arbVisibility,
  createdAt: arbISODate,
  updatedAt: arbISODate,
});

// ---------------------------------------------------------------------------
// Property 5: Community feed preview returns most recent public sightings
// ---------------------------------------------------------------------------

describe("Feature: forageflow-enhancements, Property 5: Community feed preview returns most recent public sightings", () => {
  /**
   * **Validates: Requirements 11.2**
   */
  it("returns at most 3 items, all public, sorted by createdAt descending", () => {
    fc.assert(
      fc.property(
        fc.array(arbCommunityDraft, { minLength: 0, maxLength: 30 }),
        (drafts) => {
          const result = filterCommunityPreviews(drafts);

          // 1. At most 3 results
          expect(result.length).toBeLessThanOrEqual(3);

          // 2. All returned items must have visibility === 'public'
          for (const item of result) {
            expect(item.visibility).toBe("public");
          }

          // 3. Sorted by createdAt descending
          for (let i = 1; i < result.length; i++) {
            expect(result[i - 1].createdAt >= result[i].createdAt).toBe(true);
          }

          // 4. Count of public drafts determines expected length
          const publicDrafts = drafts.filter((d) => d.visibility === "public");
          expect(result.length).toBe(Math.min(publicDrafts.length, 3));
        }
      ),
      { numRuns: 200 }
    );
  });

  it("returns all public drafts when fewer than 3 exist", () => {
    fc.assert(
      fc.property(
        fc.array(
          arbCommunityDraft.map((d) => ({ ...d, visibility: "public" as const })),
          { minLength: 0, maxLength: 2 }
        ),
        (drafts) => {
          const result = filterCommunityPreviews(drafts);
          expect(result.length).toBe(drafts.length);

          // All items are public
          for (const item of result) {
            expect(item.visibility).toBe("public");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns empty array when no public drafts exist", () => {
    fc.assert(
      fc.property(
        fc.array(
          arbCommunityDraft.map((d) => ({
            ...d,
            visibility: "private" as const,
          })),
          { minLength: 0, maxLength: 10 }
        ),
        (drafts) => {
          const result = filterCommunityPreviews(drafts);
          expect(result).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("the returned items are the most recent public drafts by createdAt", () => {
    fc.assert(
      fc.property(
        fc.array(arbCommunityDraft, { minLength: 4, maxLength: 30 }),
        (drafts) => {
          const result = filterCommunityPreviews(drafts);

          // Get all public drafts sorted by createdAt descending
          const allPublicSorted = drafts
            .filter((d) => d.visibility === "public")
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

          // The result should be the first 3 (or fewer) of allPublicSorted
          const expected = allPublicSorted.slice(0, 3);
          expect(result).toHaveLength(expected.length);

          for (let i = 0; i < result.length; i++) {
            expect(result[i].id).toBe(expected[i].id);
            expect(result[i].createdAt).toBe(expected[i].createdAt);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
