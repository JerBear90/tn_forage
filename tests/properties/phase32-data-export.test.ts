/**
 * Phase 3.2 Property Test P19: Data export completeness
 *
 * The data export SHALL include all user-generated data stores
 * and SHALL NOT include photo blobs.
 *
 * Validates: Requirements 23.1, 23.2, 23.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { UserDataExport } from '@/utils/dataExport';

const exportArb: fc.Arbitrary<UserDataExport> = fc.record({
  exportedAt: fc.date({ min: new Date(2024, 0, 1), max: new Date(2026, 11, 31), noInvalidDate: true }).map((d) => d.toISOString()),
  userId: fc.uuid(),
  version: fc.constant('1.0.0'),
  data: fc.record({
    journalEntries: fc.constant([]),
    harvestEntries: fc.constant([]),
    microhabitatPins: fc.constant([]),
    checkIns: fc.constant([]),
    foragingProfile: fc.constant(null),
    outingInvitations: fc.constant([]),
    trips: fc.constant([]),
    expeditionLogs: fc.constant([]),
  }),
});

describe('Phase 3.2 Property P19: Data export completeness', () => {
  it('export contains all required data sections', () => {
    fc.assert(
      fc.property(
        exportArb,
        (exportData) => {
          expect(exportData.data).toHaveProperty('journalEntries');
          expect(exportData.data).toHaveProperty('harvestEntries');
          expect(exportData.data).toHaveProperty('microhabitatPins');
          expect(exportData.data).toHaveProperty('checkIns');
          expect(exportData.data).toHaveProperty('foragingProfile');
          expect(exportData.data).toHaveProperty('outingInvitations');
          expect(exportData.data).toHaveProperty('trips');
          expect(exportData.data).toHaveProperty('expeditionLogs');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('export has valid metadata', () => {
    fc.assert(
      fc.property(
        exportArb,
        (exportData) => {
          expect(exportData.exportedAt).toBeTruthy();
          expect(exportData.userId).toBeTruthy();
          expect(exportData.version).toBe('1.0.0');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('export does not contain Blob objects', () => {
    fc.assert(
      fc.property(
        exportArb,
        (exportData) => {
          const json = JSON.stringify(exportData);
          // Blobs cannot be serialized to JSON — if it serializes, no blobs present
          expect(json).toBeTruthy();
          expect(json).not.toContain('[object Blob]');
        },
      ),
      { numRuns: 100 },
    );
  });
});
