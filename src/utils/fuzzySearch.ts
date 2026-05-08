/**
 * Fuzzy search utility for ForageWise.
 *
 * Provides lightweight fuzzy string matching without external dependencies.
 * Used by the full-screen search overlay to match user queries against
 * species, parks, posts, and users.
 */

/** An item that can be searched against. */
export interface SearchableItem {
  id: string;
  type: 'post' | 'species' | 'park' | 'user';
  title: string;
  subtitle?: string;
  route: string;
}

/** A search result with its relevance score. */
export interface SearchResult {
  id: string;
  type: 'post' | 'species' | 'park' | 'user';
  title: string;
  subtitle?: string;
  score: number;
  route: string;
}

/**
 * Scores how well `query` matches `target` using character-by-character
 * forward matching with gap penalty.
 *
 * - Consecutive character matches score higher
 * - Matches at word boundaries score higher
 * - Case-insensitive
 * - Returns 0 for no match, higher is better (max ~1.0)
 *
 * @param query - The search string entered by the user
 * @param target - The string to match against
 * @returns A score between 0 and ~1.0, where 0 means no match
 */
export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (q.length === 0) return 0;
  if (t.includes(q)) return 0.9 + (q.length / t.length) * 0.1; // exact substring

  let score = 0;
  let qi = 0;
  let consecutive = 0;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      consecutive++;
      score += consecutive; // reward consecutive matches
      // Bonus for word boundary match
      if (ti === 0 || t[ti - 1] === ' ' || t[ti - 1] === '-') {
        score += 2;
      }
    } else {
      consecutive = 0;
    }
  }

  if (qi < q.length) return 0; // not all query chars matched
  return score / (t.length + q.length); // normalize
}

/**
 * Searches a list of items using fuzzy scoring, filtering out non-matches
 * and sorting by relevance (highest score first).
 *
 * Scores both `title` and `subtitle` (if present), taking the higher score.
 *
 * @param query - The search string entered by the user
 * @param items - The list of searchable items to match against
 * @returns Matching items sorted by descending score
 */
export function fuzzySearch(query: string, items: SearchableItem[]): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];

  for (const item of items) {
    const titleScore = fuzzyScore(query, item.title);
    const subtitleScore = item.subtitle ? fuzzyScore(query, item.subtitle) : 0;
    const bestScore = Math.max(titleScore, subtitleScore);

    if (bestScore > 0) {
      results.push({
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        score: bestScore,
        route: item.route,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}
