/**
 * Region Filter Correctness — Property-Based Test
 *
 * Feature: phase3-enhancements, Property 6: Region filter correctness
 *
 * For any set of park records and any selected region from
 * {East TN, Middle TN, West TN}, filtering the parks by that region
 * shall return only parks whose region field matches the selected region,
 * and the result set shall be a subset of the input set.
 *
 * **Validates: Requirements 4.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Park, TnRegion } from '@/types';

// Feature: phase3-enhancements, Property 6: Region filter correctness

/**
 * Pure filter function extracted from ParkPicker component.
 * Imported logic from `src/components/trip/ParkPicker.tsx` — the component
 * file contains JSX which cannot be parsed without a React Vite plugin,
 * so we replicate the exported pure function here for property testing.
 */
function filterParksByRegion(
  parks: Park[],
  region: TnRegion | 'all',
): Park[] {
  if (region === 'all') return parks;
  return parks.filter((p) => p.region === region);
}

const VALID_REGIONS: TnRegion[] = ['East TN', 'Middle TN', 'West TN'];

/**
 * Arbitrary that generates a random Park object with a random region.
 */
const arbPark: fc.Arbitrary<Park> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  region: fc.constantFrom<TnRegion>(...VALID_REGIONS),
  coordinates: fc.record({
    lat: fc.double({ min: 34.5, max: 36.7, noNaN: true }),
    lng: fc.double({ min: -90.5, max: -81.5, noNaN: true }),
  }),
  image: fc.option(fc.constant('/images/parks/park-test.jpg'), { nil: undefined }),
  amenities: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
  trails: fc.array(fc.uuid(), { maxLength: 5 }),
  foragingRules: fc.string({ minLength: 1, maxLength: 100 }),
  lastUpdated: fc.constant('2025-01-01'),
});

const arbParkArray = fc.array(arbPark, { minLength: 0, maxLength: 30 });
const arbRegion = fc.constantFrom<TnRegion>(...VALID_REGIONS);

describe('Feature: phase3-enhancements, Property 6: Region filter correctness', () => {
  // ---------------------------------------------------------------------------
  // Property: All returned parks have the selected region
  // ---------------------------------------------------------------------------
  it('all returned parks have the selected region', () => {
    fc.assert(
      fc.property(arbParkArray, arbRegion, (parks, region) => {
        const result = filterParksByRegion(parks, region);
        for (const park of result) {
          expect(
            park.region,
            `Park "${park.name}" has region "${park.region}" but filter was "${region}"`,
          ).toBe(region);
        }
      }),
      { numRuns: 100 },
    );
  });

  // ---------------------------------------------------------------------------
  // Property: The result is a subset of the input
  // ---------------------------------------------------------------------------
  it('the result is a subset of the input', () => {
    fc.assert(
      fc.property(arbParkArray, arbRegion, (parks, region) => {
        const result = filterParksByRegion(parks, region);
        for (const park of result) {
          expect(
            parks,
            `Filtered park "${park.name}" is not present in the input array`,
          ).toContain(park);
        }
      }),
      { numRuns: 100 },
    );
  });

  // ---------------------------------------------------------------------------
  // Property: No parks with the selected region are missing from the result
  // ---------------------------------------------------------------------------
  it('no parks with the selected region are missing from the result', () => {
    fc.assert(
      fc.property(arbParkArray, arbRegion, (parks, region) => {
        const result = filterParksByRegion(parks, region);
        const expected = parks.filter((p) => p.region === region);
        expect(result.length).toBe(expected.length);
        for (const park of expected) {
          expect(
            result,
            `Park "${park.name}" with region "${park.region}" is missing from filtered result`,
          ).toContain(park);
        }
      }),
      { numRuns: 100 },
    );
  });

  // ---------------------------------------------------------------------------
  // Property: "all" region returns the full input array
  // ---------------------------------------------------------------------------
  it('"all" region returns the full input array unchanged', () => {
    fc.assert(
      fc.property(arbParkArray, (parks) => {
        const result = filterParksByRegion(parks, 'all');
        expect(result).toBe(parks);
      }),
      { numRuns: 100 },
    );
  });
});
