/**
 * Weather URL Construction — Property-Based Test
 *
 * Feature: social-profile-and-park-details, Property 16: Weather URL construction
 *
 * For any valid GPS coordinates (latitude -90 to 90, longitude -180 to 180),
 * buildWeatherUrl shall return a URL string that contains the latitude and
 * longitude values and includes "weather.gov" as a substring.
 *
 * **Validates: Requirements 11.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildWeatherUrl } from '@/utils/weatherUtils';

// Feature: social-profile-and-park-details, Property 16: Weather URL construction

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const arbLat = fc.double({ min: -90, max: 90, noNaN: true });
const arbLng = fc.double({ min: -180, max: 180, noNaN: true });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 16: Weather URL construction', () => {
  it('URL contains lat and lng as substrings', () => {
    fc.assert(
      fc.property(arbLat, arbLng, (lat, lng) => {
        const url = buildWeatherUrl({ lat, lng });
        expect(url).toContain(String(lat));
        expect(url).toContain(String(lng));
      }),
      { numRuns: 100 },
    );
  });

  it('URL contains "weather.gov"', () => {
    fc.assert(
      fc.property(arbLat, arbLng, (lat, lng) => {
        const url = buildWeatherUrl({ lat, lng });
        expect(url).toContain('weather.gov');
      }),
      { numRuns: 100 },
    );
  });

  it('URL starts with https://forecast.weather.gov/', () => {
    fc.assert(
      fc.property(arbLat, arbLng, (lat, lng) => {
        const url = buildWeatherUrl({ lat, lng });
        expect(url.startsWith('https://forecast.weather.gov/')).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
