/**
 * Recent Searches Persistence and Cap — Property-Based Test
 *
 * Feature: phase3-enhancements, Property 11: Recent searches persistence and cap
 *
 * For any sequence of N search queries saved via saveRecentSearch,
 * calling getRecentSearches shall return an array of at most 10 strings,
 * ordered newest-first, containing the most recent 10 unique queries.
 * Saving a query that already exists shall move it to the front without
 * creating a duplicate.
 *
 * **Validates: Requirements 16.2, 16.3**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  STORAGE_KEY,
  MAX_RECENT,
} from '@/offline/recentSearches';

// Feature: phase3-enhancements, Property 11: Recent searches persistence and cap

// ---------------------------------------------------------------------------
// localStorage polyfill for Node test environment
// ---------------------------------------------------------------------------

if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const ALPHA = 'abcdefghijklmnopqrstuvwxyz ';

const arbSearchQuery = fc
  .array(fc.constantFrom(...ALPHA.split('')), { minLength: 1, maxLength: 20 })
  .map((chars) => chars.join(''))
  .filter((s) => s.trim().length > 0);

const arbQuerySequence = fc.array(arbSearchQuery, { minLength: 1, maxLength: 25 });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  clearRecentSearches();
});

describe('Feature: phase3-enhancements, Property 11: Recent searches persistence and cap', () => {
  it('stores at most MAX_RECENT entries, newest first', () => {
    fc.assert(
      fc.property(arbQuerySequence, (queries) => {
        clearRecentSearches();

        for (const q of queries) {
          saveRecentSearch(q);
        }

        const result = getRecentSearches();

        // At most MAX_RECENT entries
        expect(result.length).toBeLessThanOrEqual(MAX_RECENT);

        // The most recently saved query should be first
        const lastQuery = queries[queries.length - 1].trim();
        if (lastQuery) {
          expect(result[0]).toBe(lastQuery);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('contains no duplicates', () => {
    fc.assert(
      fc.property(arbQuerySequence, (queries) => {
        clearRecentSearches();

        for (const q of queries) {
          saveRecentSearch(q);
        }

        const result = getRecentSearches();
        const unique = new Set(result);
        expect(unique.size).toBe(result.length);
      }),
      { numRuns: 100 },
    );
  });

  it('moves existing query to front without creating a duplicate', () => {
    fc.assert(
      fc.property(
        arbSearchQuery,
        arbQuerySequence,
        (duplicateQuery, otherQueries) => {
          clearRecentSearches();

          // Save the duplicate query first
          saveRecentSearch(duplicateQuery);

          // Save other queries
          for (const q of otherQueries) {
            saveRecentSearch(q);
          }

          // Save the duplicate query again
          saveRecentSearch(duplicateQuery);

          const result = getRecentSearches();

          // The duplicate should be at the front
          expect(result[0]).toBe(duplicateQuery.trim());

          // No duplicates
          const unique = new Set(result);
          expect(unique.size).toBe(result.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('preserves newest-first ordering', () => {
    fc.assert(
      fc.property(
        fc.array(arbSearchQuery, { minLength: 2, maxLength: 8 }).map((queries) => {
          // Ensure all queries are unique (trimmed) for deterministic ordering
          const seen = new Set<string>();
          return queries.filter((q) => {
            const t = q.trim();
            if (seen.has(t)) return false;
            seen.add(t);
            return true;
          });
        }).filter((arr) => arr.length >= 2),
        (uniqueQueries) => {
          clearRecentSearches();

          for (const q of uniqueQueries) {
            saveRecentSearch(q);
          }

          const result = getRecentSearches();

          // The result should be the reverse of insertion order (newest first),
          // capped at MAX_RECENT
          const expected = [...uniqueQueries].reverse().slice(0, MAX_RECENT);
          const trimmedExpected = expected.map((q) => q.trim());

          expect(result).toEqual(trimmedExpected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('clearRecentSearches removes all entries', () => {
    fc.assert(
      fc.property(arbQuerySequence, (queries) => {
        clearRecentSearches();

        for (const q of queries) {
          saveRecentSearch(q);
        }

        clearRecentSearches();
        const result = getRecentSearches();
        expect(result).toEqual([]);
      }),
      { numRuns: 100 },
    );
  });

  it('ignores empty or whitespace-only queries', () => {
    clearRecentSearches();

    saveRecentSearch('');
    saveRecentSearch('   ');
    saveRecentSearch('\t');

    const result = getRecentSearches();
    expect(result).toEqual([]);
  });
});
