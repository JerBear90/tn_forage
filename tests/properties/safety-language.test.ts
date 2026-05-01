/**
 * Safety Language Compliance — Property-Based Test
 *
 * Feature: phase3-enhancements, Property 4: Safety language compliance
 *
 * For any species record in speciesSeed or plant record in plantsSeed,
 * no string-typed field value shall contain the phrases "safe to eat",
 * "definitely edible", "confirmed edible", or "AI verified" (case-insensitive).
 * Additionally, for any record with edibilityLabel equal to
 * "commonly-considered-edible-with-expert-confirmation", the safetyNotes
 * field shall contain the phrase "Verify with a qualified expert before consuming".
 *
 * **Validates: Requirements 1.6, 2.6, 18.1, 18.2, 18.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { speciesSeed } from '@/data/speciesSeed';
import { plantsSeed } from '@/data/plantsSeed';

// Feature: phase3-enhancements, Property 4: Safety language compliance

const FORBIDDEN_PHRASES = [
  'safe to eat',
  'definitely edible',
  'confirmed edible',
  'ai verified',
];

const EXPERT_EDIBILITY_LABEL = 'commonly-considered-edible-with-expert-confirmation';
const REQUIRED_SAFETY_PHRASE = 'Verify with a qualified expert before consuming';

/**
 * Collect all string-typed field values from a record (shallow — top-level only).
 */
function getStringFieldValues(record: Record<string, unknown>): string[] {
  const values: string[] = [];
  for (const key of Object.keys(record)) {
    const val = record[key];
    if (typeof val === 'string') {
      values.push(val);
    }
  }
  return values;
}

/**
 * Check whether a string contains any forbidden phrase (case-insensitive).
 */
function containsForbiddenPhrase(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase)) {
      return phrase;
    }
  }
  return null;
}

describe('Feature: phase3-enhancements, Property 4: Safety language compliance', () => {
  // ---------------------------------------------------------------------------
  // Species seed — forbidden phrases
  // ---------------------------------------------------------------------------
  describe('speciesSeed forbidden phrase check', () => {
    it('no species record string field contains a forbidden phrase', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...speciesSeed),
          (species) => {
            const stringValues = getStringFieldValues(species as unknown as Record<string, unknown>);
            for (const value of stringValues) {
              const found = containsForbiddenPhrase(value);
              expect(
                found,
                `Species "${species.commonName}" contains forbidden phrase "${found}" in value: "${value.substring(0, 80)}…"`,
              ).toBeNull();
            }
          },
        ),
        { numRuns: speciesSeed.length },
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Plant seed — forbidden phrases
  // ---------------------------------------------------------------------------
  describe('plantsSeed forbidden phrase check', () => {
    it('no plant record string field contains a forbidden phrase', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...plantsSeed),
          (plant) => {
            const stringValues = getStringFieldValues(plant as unknown as Record<string, unknown>);
            for (const value of stringValues) {
              const found = containsForbiddenPhrase(value);
              expect(
                found,
                `Plant "${plant.commonName}" contains forbidden phrase "${found}" in value: "${value.substring(0, 80)}…"`,
              ).toBeNull();
            }
          },
        ),
        { numRuns: plantsSeed.length },
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Species seed — expert confirmation requirement
  // ---------------------------------------------------------------------------
  describe('speciesSeed expert confirmation safety notes', () => {
    const edibleSpecies = speciesSeed.filter(
      (s) => s.edibilityLabel === EXPERT_EDIBILITY_LABEL,
    );

    it('every species with edibility label "commonly-considered-edible-with-expert-confirmation" includes required safety phrase', () => {
      // Guard: ensure we have species with this label to test
      expect(edibleSpecies.length).toBeGreaterThan(0);

      fc.assert(
        fc.property(
          fc.constantFrom(...edibleSpecies),
          (species) => {
            expect(
              species.safetyNotes,
              `Species "${species.commonName}" with edibilityLabel "${EXPERT_EDIBILITY_LABEL}" is missing required phrase in safetyNotes`,
            ).toContain(REQUIRED_SAFETY_PHRASE);
          },
        ),
        { numRuns: edibleSpecies.length },
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Plant seed — expert confirmation requirement
  // ---------------------------------------------------------------------------
  describe('plantsSeed expert confirmation safety notes', () => {
    const ediblePlants = plantsSeed.filter(
      (p) => p.edibilityLabel === EXPERT_EDIBILITY_LABEL,
    );

    it('every plant with edibility label "commonly-considered-edible-with-expert-confirmation" includes required safety phrase', () => {
      // Guard: ensure we have plants with this label to test
      expect(ediblePlants.length).toBeGreaterThan(0);

      fc.assert(
        fc.property(
          fc.constantFrom(...ediblePlants),
          (plant) => {
            expect(
              plant.safetyNotes,
              `Plant "${plant.commonName}" with edibilityLabel "${EXPERT_EDIBILITY_LABEL}" is missing required phrase in safetyNotes`,
            ).toContain(REQUIRED_SAFETY_PHRASE);
          },
        ),
        { numRuns: ediblePlants.length },
      );
    });
  });
});
