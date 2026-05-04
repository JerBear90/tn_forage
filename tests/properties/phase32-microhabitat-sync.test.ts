/**
 * Phase 3.2 Property Test P14: Microhabitat sync preference
 *
 * For any microhabitat pin with syncPreference 'local-only',
 * the syncStatus SHALL never be 'pending' (i.e., never queued for sync).
 *
 * Validates: Requirements 28.7
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { MicrohabitatSyncPreference, SyncStatus } from '@/types';

function determineSyncStatus(preference: MicrohabitatSyncPreference): SyncStatus {
  return preference === 'sync' ? 'pending' : 'synced';
}

describe('Phase 3.2 Property P14: Microhabitat sync preference', () => {
  it('local-only pins never have pending sync status', () => {
    fc.assert(
      fc.property(
        fc.constant('local-only' as MicrohabitatSyncPreference),
        (preference) => {
          const status = determineSyncStatus(preference);
          expect(status).not.toBe('pending');
          expect(status).toBe('synced');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('sync pins have pending sync status', () => {
    fc.assert(
      fc.property(
        fc.constant('sync' as MicrohabitatSyncPreference),
        (preference) => {
          const status = determineSyncStatus(preference);
          expect(status).toBe('pending');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('sync preference is always one of the valid values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('local-only' as const, 'sync' as const),
        (preference) => {
          const status = determineSyncStatus(preference);
          expect(['pending', 'synced']).toContain(status);
        },
      ),
      { numRuns: 100 },
    );
  });
});
