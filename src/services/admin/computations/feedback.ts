/**
 * Pure aggregation functions for feedback analytics.
 *
 * All functions are pure — no side effects, no PocketBase calls.
 */

/**
 * Computes the arithmetic mean of an array of ratings.
 *
 * @param ratings - Array of numeric ratings (typically 1–5)
 * @returns The average rating, or 0 for empty arrays
 */
export function computeAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  return sum / ratings.length;
}

/**
 * Computes the distribution of ratings across buckets 1–5.
 *
 * Always returns exactly 5 buckets (ratings 1 through 5), even if
 * some have zero count.
 *
 * @param ratings - Array of numeric ratings (typically 1–5)
 * @returns Array of { rating, count } objects for ratings 1–5
 */
export function computeRatingDistribution(
  ratings: number[],
): { rating: number; count: number }[] {
  const counts = new Map<number, number>();
  for (let i = 1; i <= 5; i++) {
    counts.set(i, 0);
  }

  for (const r of ratings) {
    const bucket = Math.round(r);
    if (bucket >= 1 && bucket <= 5) {
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries()).map(([rating, count]) => ({
    rating,
    count,
  }));
}

/**
 * Filters records by a specific rating value.
 *
 * If rating is null, returns all records unfiltered.
 *
 * @param records - Array of objects with a `rating` field
 * @param rating - The rating to filter by, or null to return all
 * @returns Filtered array of records matching the specified rating
 */
export function filterByRating<T extends { rating: number }>(
  records: T[],
  rating: number | null,
): T[] {
  if (rating === null) return records;
  return records.filter((r) => r.rating === rating);
}
