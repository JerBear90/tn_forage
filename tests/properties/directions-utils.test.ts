/**
 * Directions URL Construction — Property-Based Test
 *
 * Feature: social-profile-and-park-details, Property 15: Directions URL construction
 *
 * For any valid GPS coordinates (latitude -90 to 90, longitude -180 to 180),
 * buildDirectionsUrl shall return a URL string that contains the latitude and
 * longitude values as substrings.
 *
 * **Validates: Requirements 10.1, 10.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildDirectionsUrl } from '@/utils/directionsUtils';

// Feature: social-profile-and-park-details, Property 15: Directions URL construction

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const arbLat = fc.double({ min: -90, max: 90, noNaN: true });
const arbLng = fc.double({ min: -180, max: 180, noNaN: true });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 15: Directions URL construction', () => {
  it('URL contains lat and lng as substrings', () => {
    fc.assert(
      fc.property(arbLat, arbLng, (lat, lng) => {
        const url = buildDirectionsUrl({ lat, lng });
        expect(url).toContain(String(lat));
        expect(url).toContain(String(lng));
      }),
      { numRuns: 100 },
    );
  });

  it('URL starts with https://www.google.com/maps/dir/', () => {
    fc.assert(
      fc.property(arbLat, arbLng, (lat, lng) => {
        const url = buildDirectionsUrl({ lat, lng });
        expect(url.startsWith('https://www.google.com/maps/dir/')).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('URL contains destination=', () => {
    fc.assert(
      fc.property(arbLat, arbLng, (lat, lng) => {
        const url = buildDirectionsUrl({ lat, lng });
        expect(url).toContain('destination=');
      }),
      { numRuns: 100 },
    );
  });
});
