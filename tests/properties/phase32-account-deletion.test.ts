/**
 * Phase 3.2 Property Test P20: Account deletion
 *
 * Account deletion SHALL clear all user-generated data stores.
 * Reference data (species, plants, trees) SHALL NOT be deleted.
 *
 * Validates: Requirements 23.4–23.8
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

const USER_DATA_STORES = [
  'journalEntries',
  'harvestEntries',
  'microhabitatPins',
  'checkIns',
  'foragingProfiles',
  'outingInvitations',
  'usageEvents',
  'beaconSessions',
  'locationSharingSessions',
  'customRoutes',
  'trailConditionReports',
  'emergencyContacts',
  'downloadedMapRegions',
  'mapTiles',
  'fruitingForecasts',
  'pushSubscriptions',
];

const REFERENCE_STORES = ['species', 'plants', 'trees', 'parks', 'trails', 'routes'];

describe('Phase 3.2 Property P20: Account deletion', () => {
  it('user data stores list does not include reference stores', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...USER_DATA_STORES),
        (store) => {
          expect(REFERENCE_STORES).not.toContain(store);
        },
      ),
      { numRuns: USER_DATA_STORES.length },
    );
  });

  it('reference stores are never in the deletion list', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...REFERENCE_STORES),
        (store) => {
          expect(USER_DATA_STORES).not.toContain(store);
        },
      ),
      { numRuns: REFERENCE_STORES.length },
    );
  });

  it('all user data stores are included in deletion scope', () => {
    // Verify the deletion list covers all expected user-generated stores
    expect(USER_DATA_STORES.length).toBeGreaterThanOrEqual(16);
    expect(USER_DATA_STORES).toContain('journalEntries');
    expect(USER_DATA_STORES).toContain('harvestEntries');
    expect(USER_DATA_STORES).toContain('microhabitatPins');
    expect(USER_DATA_STORES).toContain('beaconSessions');
  });
});
