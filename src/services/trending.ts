import type { CommunityDraft } from '@/types';

/**
 * A trending species entry aggregated from community sightings.
 */
export interface TrendingSpecies {
  speciesGuess: string;
  count: number;
  matchedSpeciesId?: string;
  image?: string;
}

/**
 * Known species record shape accepted by trending utilities.
 * Kept minimal so callers can pass species, plants, or any entity
 * with an id, commonName, and images array.
 */
export interface KnownSpeciesRecord {
  id: string;
  commonName: string;
  images: string[];
}

/**
 * Match a species guess string against a list of known species/plants
 * using case-insensitive comparison on `commonName`.
 *
 * Returns the matched record or `undefined` if no match is found.
 * Exported for reuse in SightingCard and other components.
 */
export function matchSpeciesImage(
  speciesGuess: string,
  knownSpecies: KnownSpeciesRecord[],
): { id: string; image: string | undefined } | undefined {
  if (!speciesGuess) return undefined;

  const guessLower = speciesGuess.toLowerCase();
  const match = knownSpecies.find(
    (s) => s.commonName.toLowerCase() === guessLower,
  );

  if (!match) return undefined;

  return {
    id: match.id,
    image: match.images.length > 0 ? match.images[0] : undefined,
  };
}

/**
 * Aggregate trending species from community sightings.
 *
 * This is a pure function — it does not access IndexedDB. Callers are
 * responsible for loading sightings and known species before invoking.
 *
 * Steps:
 * 1. Filter sightings to the current calendar month by `createdAt`
 * 2. Group by case-insensitive `speciesGuess`
 * 3. Sort groups by count descending
 * 4. Match each group against known species for images
 * 5. Return the top N results (default 3)
 */
export function aggregateTrendingSpecies(
  sightings: CommunityDraft[],
  knownSpecies: KnownSpeciesRecord[],
  topN: number = 3,
): TrendingSpecies[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // 1. Filter to current calendar month
  const currentMonthSightings = sightings.filter((s) => {
    if (!s.speciesGuess) return false;
    const created = new Date(s.createdAt);
    return (
      created.getFullYear() === currentYear &&
      created.getMonth() === currentMonth
    );
  });

  // 2. Group by case-insensitive speciesGuess
  const countMap = new Map<string, { displayName: string; count: number }>();

  for (const sighting of currentMonthSightings) {
    const guess = sighting.speciesGuess!;
    const key = guess.toLowerCase();
    const existing = countMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      // Use the first occurrence as the display name
      countMap.set(key, { displayName: guess, count: 1 });
    }
  }

  // 3. Sort by count descending
  const sorted = Array.from(countMap.values()).sort(
    (a, b) => b.count - a.count,
  );

  // 4. Match against known species and build results
  const results: TrendingSpecies[] = sorted.map((entry) => {
    const match = matchSpeciesImage(entry.displayName, knownSpecies);
    return {
      speciesGuess: entry.displayName,
      count: entry.count,
      matchedSpeciesId: match?.id,
      image: match?.image,
    };
  });

  // 5. Return top N
  return results.slice(0, topN);
}
