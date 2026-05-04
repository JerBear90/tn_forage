/**
 * Phase 3.2 Property Test P6: Trail condition aggregation from 7-day window
 *
 * For any trail with a set of TrailConditionReport records, the displayed
 * trail condition SHALL be determined by aggregating only reports from the
 * last 7 days. The displayed category SHALL be the most frequently reported.
 * If no reports exist within 7 days, the display SHALL show null.
 *
 * Validates: Requirements 10.1, 17.8
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { aggregateTrailConditions } from '@/utils/trailConditionAggregator';
import type { TrailConditionReport, TrailConditionCategory } from '@/types';

const CATEGORIES: TrailConditionCategory[] = ['clear', 'issues', 'bad-closed', 'dry', 'muddy', 'snowy'];
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Arbitrary trail condition report generator.
 */
const reportArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  trailId: fc.constant('trail-test'),
  categories: fc.array(fc.constantFrom(...CATEGORIES), { minLength: 1, maxLength: 3 }),
  details: fc.option(fc.string({ maxLength: 100 })),
  reportedAt: fc.date({ min: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), max: new Date() }).map((d) => d.toISOString()),
  syncStatus: fc.constant('synced' as const),
});

describe('Phase 3.2 Property P6: Trail condition aggregation', () => {
  it('only considers reports from the last 7 days', () => {
    fc.assert(
      fc.property(
        fc.array(reportArb, { minLength: 1, maxLength: 20 }),
        (reports) => {
          const now = Date.now();
          const result = aggregateTrailConditions(reports as TrailConditionReport[], now);

          // If result has data, verify all counted reports are within 7 days
          if (result.hasData) {
            const cutoff = now - SEVEN_DAYS_MS;
            const recentReports = reports.filter(
              (r) => new Date(r.reportedAt).getTime() >= cutoff,
            );
            expect(result.reportCount).toBe(recentReports.length);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns null category when no reports exist within 7 days', () => {
    fc.assert(
      fc.property(
        fc.array(reportArb, { minLength: 0, maxLength: 10 }),
        (reports) => {
          // Set all reports to be older than 7 days
          const oldReports = reports.map((r) => ({
            ...r,
            reportedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          }));

          const result = aggregateTrailConditions(oldReports as TrailConditionReport[]);
          expect(result.displayedCategory).toBeNull();
          expect(result.hasData).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('displayed category is the most frequently reported', () => {
    fc.assert(
      fc.property(
        fc.array(reportArb, { minLength: 3, maxLength: 20 }),
        (reports) => {
          // Make all reports recent
          const recentReports = reports.map((r) => ({
            ...r,
            reportedAt: new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000).toISOString(),
          }));

          const result = aggregateTrailConditions(recentReports as TrailConditionReport[]);

          if (result.hasData && result.displayedCategory) {
            // Count categories manually
            const counts = new Map<TrailConditionCategory, number>();
            for (const report of recentReports) {
              for (const cat of report.categories) {
                counts.set(cat, (counts.get(cat) ?? 0) + 1);
              }
            }

            // The displayed category should be the most frequent
            let maxCount = 0;
            for (const count of Array.from(counts.values())) {
              if (count > maxCount) maxCount = count;
            }

            const displayedCount = counts.get(result.displayedCategory) ?? 0;
            expect(displayedCount).toBe(maxCount);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
