/**
 * Search analytics computation utilities.
 *
 * Pure functions for computing top search terms, zero-result searches,
 * click-through rate, and content gap identification. No side effects,
 * no PocketBase calls.
 */

/**
 * Computes the top N most searched terms from a list of search queries.
 *
 * Groups queries by term (case-insensitive), counts occurrences, and
 * returns the top N sorted by count descending.
 *
 * @param queries - Array of search query objects with a term field
 * @param limit - Maximum number of terms to return
 * @returns Array of { term, count } sorted by count descending
 */
export function computeTopTerms(
  queries: Array<{ term: string }>,
  limit: number
): Array<{ term: string; count: number }> {
  if (queries.length === 0 || limit <= 0) return [];

  const termCounts = new Map<string, number>();

  for (const query of queries) {
    const normalizedTerm = query.term.toLowerCase().trim();
    if (normalizedTerm === '') continue;
    termCounts.set(normalizedTerm, (termCounts.get(normalizedTerm) ?? 0) + 1);
  }

  const sorted = Array.from(termCounts.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));

  return sorted.slice(0, limit);
}

/**
 * Identifies searches that returned zero results.
 *
 * Groups queries with resultsCount = 0 by term (case-insensitive) and
 * returns them sorted by count descending.
 *
 * @param queries - Array of search query objects with term and resultsCount
 * @returns Array of { term, count } for zero-result searches, sorted by count descending
 */
export function computeZeroResultSearches(
  queries: Array<{ term: string; resultsCount: number }>
): Array<{ term: string; count: number }> {
  if (queries.length === 0) return [];

  const zeroResultCounts = new Map<string, number>();

  for (const query of queries) {
    if (query.resultsCount === 0) {
      const normalizedTerm = query.term.toLowerCase().trim();
      if (normalizedTerm === '') continue;
      zeroResultCounts.set(
        normalizedTerm,
        (zeroResultCounts.get(normalizedTerm) ?? 0) + 1
      );
    }
  }

  return Array.from(zeroResultCounts.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));
}

/**
 * Computes the click-through rate for search results.
 *
 * CTR = (searches where user clicked a result / total searches) × 100
 *
 * @param queries - Array of search query objects with clickedResult boolean
 * @returns Click-through rate as a percentage (0-100), or 0 if no queries
 */
export function computeClickThroughRate(
  queries: Array<{ clickedResult: boolean }>
): number {
  if (queries.length === 0) return 0;

  const clickedCount = queries.filter((q) => q.clickedResult).length;
  return (clickedCount / queries.length) * 100;
}

/**
 * Identifies content gaps — terms where EVERY occurrence has resultsCount = 0.
 *
 * A content gap is a search term that never returns any results, indicating
 * missing content that users are looking for.
 *
 * @param queries - Array of search query objects with term and resultsCount
 * @returns Array of term strings that always return zero results
 */
export function identifyContentGaps(
  queries: Array<{ term: string; resultsCount: number }>
): string[] {
  if (queries.length === 0) return [];

  // Track whether each term has ever returned results
  const termHasResults = new Map<string, boolean>();

  for (const query of queries) {
    const normalizedTerm = query.term.toLowerCase().trim();
    if (normalizedTerm === '') continue;

    const currentHasResults = termHasResults.get(normalizedTerm) ?? false;
    if (query.resultsCount > 0) {
      termHasResults.set(normalizedTerm, true);
    } else if (!currentHasResults) {
      termHasResults.set(normalizedTerm, false);
    }
  }

  // Return terms that never had results
  return Array.from(termHasResults.entries())
    .filter(([, hasResults]) => !hasResults)
    .map(([term]) => term)
    .sort();
}
