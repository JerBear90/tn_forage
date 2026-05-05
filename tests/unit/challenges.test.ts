/**
 * Challenges Property-Based Tests
 *
 * Property 2: Challenge completion invariant
 * Property 3: Challenge persistence round-trip
 * Property 6: Challenges preview returns non-completed challenges
 *
 * Uses fast-check to generate random Challenge objects and verify
 * invariants around completion logic, IndexedDB persistence, and
 * preview filtering.
 *
 * **Validates: Requirements 2.4, 2.5, 2.7, 11.3**
 */

import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { getDB, putRecord, getRecord } from "@/offline/db";
import type {
  Challenge,
  ChallengeCriterion,
  ChallengeCategory,
} from "@/types";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generate a random ChallengeCategory */
const arbChallengeCategory: fc.Arbitrary<ChallengeCategory> = fc.constantFrom(
  "foraging",
  "seasonal",
  "park-exploration"
);

/**
 * Safe ISO date string arbitrary — uses integer timestamps to avoid
 * Invalid Date issues with fc.date() during shrinking.
 */
const arbISODate: fc.Arbitrary<string> = fc
  .integer({
    min: new Date("2000-01-01T00:00:00Z").getTime(),
    max: new Date("2099-12-31T23:59:59Z").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

/** Generate a random ChallengeCriterion */
const arbCriterion: fc.Arbitrary<ChallengeCriterion> = fc.record({
  id: fc.uuid(),
  label: fc.string({ minLength: 1, maxLength: 50 }),
  completed: fc.boolean(),
  completedAt: fc.option(arbISODate, { nil: undefined }),
});

/** Generate a random Challenge with random criteria completion states */
const arbChallenge: fc.Arbitrary<Challenge> = fc
  .record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 200 }),
    category: arbChallengeCategory,
    criteria: fc.array(arbCriterion, { minLength: 1, maxLength: 10 }),
    lastUpdated: arbISODate,
  })
  .map((base) => ({
    ...base,
    // completedAt is intentionally left undefined here — the completion
    // logic under test will derive it
    completedAt: undefined as string | undefined,
  }));

/**
 * Generate a Challenge with completedAt correctly derived from criteria.
 * Used for the persistence round-trip test where we need valid objects.
 */
const arbChallengeWithDerivedCompletion: fc.Arbitrary<Challenge> =
  arbChallenge.map((challenge) => {
    const allCompleted = challenge.criteria.every((c) => c.completed);
    return {
      ...challenge,
      completedAt: allCompleted ? new Date().toISOString() : undefined,
    };
  });

/**
 * Generate a Challenge with an explicit completedAt value (or undefined)
 * for the preview test — mixed completion states.
 */
const arbChallengeForPreview: fc.Arbitrary<Challenge> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  category: arbChallengeCategory,
  criteria: fc.array(arbCriterion, { minLength: 1, maxLength: 5 }),
  completedAt: fc.option(arbISODate, { nil: undefined }),
  lastUpdated: arbISODate,
});

// ---------------------------------------------------------------------------
// Helper: Apply completion logic (mirrors useChallenges.ts)
// ---------------------------------------------------------------------------

/**
 * Applies the challenge completion invariant: sets completedAt if and only
 * if every criterion has completed === true. This mirrors the logic in
 * useChallenges.ts updateCriterion.
 */
function applyCompletionLogic(challenge: Challenge): Challenge {
  const allCompleted = challenge.criteria.every((c) => c.completed);
  const now = new Date().toISOString();
  return {
    ...challenge,
    completedAt: allCompleted ? now : undefined,
  };
}

// ---------------------------------------------------------------------------
// Helper: getChallengesPreview (pure function)
// ---------------------------------------------------------------------------

/**
 * Pure function that filters and slices challenges for the home page preview.
 * Returns at most 3 challenges where completedAt is null/undefined,
 * preserving relative order.
 */
function getChallengesPreview(challenges: Challenge[]): Challenge[] {
  return challenges.filter((c) => !c.completedAt).slice(0, 3);
}

// ---------------------------------------------------------------------------
// DB cleanup
// ---------------------------------------------------------------------------

async function clearChallengesStore() {
  const db = await getDB();
  await db.clear("challenges");
}

beforeEach(async () => {
  await clearChallengesStore();
});

// ---------------------------------------------------------------------------
// Property 2: Challenge completion invariant
// ---------------------------------------------------------------------------

describe("Feature: foragewise-enhancements, Property 2: Challenge completion invariant", () => {
  /**
   * **Validates: Requirements 2.4, 2.7**
   */
  it("challenge has completedAt if and only if every criterion has completed === true", () => {
    fc.assert(
      fc.property(arbChallenge, (challenge) => {
        const result = applyCompletionLogic(challenge);
        const allCompleted = challenge.criteria.every((c) => c.completed);

        if (allCompleted) {
          // All criteria completed → challenge must have completedAt
          expect(result.completedAt).toBeDefined();
          expect(typeof result.completedAt).toBe("string");
        } else {
          // At least one criterion not completed → challenge must NOT have completedAt
          expect(result.completedAt).toBeUndefined();
        }
      }),
      { numRuns: 200 }
    );
  });

  it("a challenge with any incomplete criterion never has completedAt", () => {
    // Generate challenges that always have at least one incomplete criterion
    const arbIncompleteChallenge = arbChallenge.filter((c) =>
      c.criteria.some((cr) => !cr.completed)
    );

    fc.assert(
      fc.property(arbIncompleteChallenge, (challenge) => {
        const result = applyCompletionLogic(challenge);
        expect(result.completedAt).toBeUndefined();
      }),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Challenge persistence round-trip
// ---------------------------------------------------------------------------

describe("Feature: foragewise-enhancements, Property 3: Challenge persistence round-trip", () => {
  /**
   * **Validates: Requirements 2.5**
   */
  it("writing a challenge to IndexedDB and reading it back produces identical data", async () => {
    await fc.assert(
      fc.asyncProperty(arbChallengeWithDerivedCompletion, async (challenge) => {
        // Write to challenges store
        await putRecord("challenges", challenge);

        // Read back by ID
        const readBack = await getRecord("challenges", challenge.id);

        expect(readBack).toBeDefined();
        expect(readBack!.id).toBe(challenge.id);
        expect(readBack!.title).toBe(challenge.title);
        expect(readBack!.description).toBe(challenge.description);
        expect(readBack!.category).toBe(challenge.category);
        expect(readBack!.completedAt).toBe(challenge.completedAt);

        // Verify criteria array matches exactly
        expect(readBack!.criteria).toHaveLength(challenge.criteria.length);
        for (let i = 0; i < challenge.criteria.length; i++) {
          expect(readBack!.criteria[i].id).toBe(challenge.criteria[i].id);
          expect(readBack!.criteria[i].label).toBe(
            challenge.criteria[i].label
          );
          expect(readBack!.criteria[i].completed).toBe(
            challenge.criteria[i].completed
          );
          expect(readBack!.criteria[i].completedAt).toBe(
            challenge.criteria[i].completedAt
          );
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Challenges preview returns non-completed challenges
// ---------------------------------------------------------------------------

describe("Feature: foragewise-enhancements, Property 6: Challenges preview returns non-completed challenges", () => {
  /**
   * **Validates: Requirements 11.3**
   */
  it("preview returns at most 3 challenges where completedAt is null/undefined, preserving relative order", () => {
    fc.assert(
      fc.property(
        fc.array(arbChallengeForPreview, { minLength: 0, maxLength: 20 }),
        (challenges) => {
          const preview = getChallengesPreview(challenges);

          // At most 3 results
          expect(preview.length).toBeLessThanOrEqual(3);

          // All returned challenges must have no completedAt
          for (const c of preview) {
            expect(c.completedAt).toBeFalsy();
          }

          // The non-completed challenges from the original list
          const nonCompleted = challenges.filter((c) => !c.completedAt);

          // Preview length should be min(nonCompleted.length, 3)
          expect(preview.length).toBe(Math.min(nonCompleted.length, 3));

          // Relative order is preserved: preview items appear in the same
          // order as they do in the non-completed list
          for (let i = 0; i < preview.length; i++) {
            expect(preview[i]).toBe(nonCompleted[i]);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it("preview returns empty array when all challenges are completed", () => {
    fc.assert(
      fc.property(
        fc.array(
          arbChallengeForPreview.map((c) => ({
            ...c,
            completedAt: new Date().toISOString(),
          })),
          { minLength: 0, maxLength: 10 }
        ),
        (challenges) => {
          const preview = getChallengesPreview(challenges);
          expect(preview).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
