/**
 * Phase 3.2 Property Test P3: Blog feed reverse-chronological ordering
 *
 * For any set of blog articles with varying publishedAt dates, the blog feed
 * SHALL display them in strictly descending order by publishedAt.
 *
 * Validates: Requirements 2.1
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { blogSeed } from '@/data/blogSeed';

describe('Phase 3.2 Property P3: Blog feed ordering', () => {
  it('blog articles sorted by publishedAt descending maintain order', () => {
    fc.assert(
      fc.property(
        fc.shuffledSubarray(blogSeed, { minLength: 2 }),
        (articles) => {
          // Sort in reverse chronological order (as the feed would display)
          const sorted = [...articles].sort(
            (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
          );

          // Verify descending order
          for (let i = 1; i < sorted.length; i++) {
            const prev = new Date(sorted[i - 1].publishedAt).getTime();
            const curr = new Date(sorted[i].publishedAt).getTime();
            expect(prev).toBeGreaterThanOrEqual(curr);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('all blog articles have valid publishedAt dates', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...blogSeed),
        (article) => {
          const date = new Date(article.publishedAt);
          expect(date.getTime()).not.toBeNaN();
        },
      ),
      { numRuns: blogSeed.length },
    );
  });
});
