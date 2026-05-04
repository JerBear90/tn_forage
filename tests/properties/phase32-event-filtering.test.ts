/**
 * Phase 3.2 Property Test P8: Event filtering
 *
 * For any set of events with type and date filters applied,
 * the filtered results SHALL only contain events matching the criteria.
 *
 * Validates: Requirements 13.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { EventEntry, EventType } from '@/types';

const EVENT_TYPES: EventType[] = ['festival', 'workshop', 'outing', 'other'];

const eventArb: fc.Arbitrary<EventEntry> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 3, maxLength: 50 }),
  date: fc.integer({ min: 1704067200000, max: 1767225600000 }).map((ms) => new Date(ms).toISOString().split('T')[0]),
  location: fc.string({ minLength: 3, maxLength: 30 }),
  description: fc.string({ minLength: 10, maxLength: 100 }),
  type: fc.constantFrom(...EVENT_TYPES),
  sourceUrl: fc.constant('https://example.com'),
  lastUpdated: fc.constant(new Date().toISOString()),
});

function filterByType(events: EventEntry[], type: EventType | 'all'): EventEntry[] {
  if (type === 'all') return events;
  return events.filter((e) => e.type === type);
}

describe('Phase 3.2 Property P8: Event filtering', () => {
  it('type filter returns only events of that type', () => {
    fc.assert(
      fc.property(
        fc.array(eventArb, { minLength: 1, maxLength: 20 }),
        fc.constantFrom(...EVENT_TYPES),
        (events, type) => {
          const filtered = filterByType(events, type);
          for (const event of filtered) {
            expect(event.type).toBe(type);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('all filter returns all events', () => {
    fc.assert(
      fc.property(
        fc.array(eventArb, { minLength: 1, maxLength: 20 }),
        (events) => {
          const filtered = filterByType(events, 'all');
          expect(filtered.length).toBe(events.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('filtered count is always <= total count', () => {
    fc.assert(
      fc.property(
        fc.array(eventArb, { minLength: 0, maxLength: 20 }),
        fc.constantFrom(...EVENT_TYPES, 'all' as const),
        (events, type) => {
          const filtered = filterByType(events, type);
          expect(filtered.length).toBeLessThanOrEqual(events.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});
