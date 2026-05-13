'use client';

/**
 * ForageWise — useTopParks Hook
 *
 * Computes the top parks for a given species by querying IndexedDB trails
 * and parks stores. Filters trails by likelySpecies containing the speciesId,
 * groups by parkId, counts trail occurrences per park, resolves park names
 * and regions, and returns the top 5 parks sorted by trail count descending
 * with ties broken alphabetically by park name.
 *
 * Exports `computeTopParks` as a pure function for testability.
 */

import { useState, useEffect } from 'react';
import { getAllRecords, batchGetRecords } from '@/offline/db';
import type { Trail, Park } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TopPark {
  id: string;
  name: string;
  region: string;
  trailCount: number;
}

export interface UseTopParksResult {
  parks: TopPark[];
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Pure Computation
// ---------------------------------------------------------------------------

/**
 * Pure logic: given trails and parks, compute top parks for a species.
 * Exported for testability.
 *
 * 1. Filter trails where likelySpecies includes speciesId
 * 2. Group by parkId, count trail occurrences per park
 * 3. Resolve park names and regions from parks array
 * 4. Sort by trail count descending, ties broken alphabetically by park name
 * 5. Return top `maxParks` parks (default 5)
 */
export function computeTopParks(
  speciesId: string,
  trails: Trail[],
  parks: Park[],
  maxParks: number = 5,
): TopPark[] {
  if (!speciesId) return [];

  // Step 1: Filter trails that reference this species
  const matchingTrails = trails.filter(
    (trail) => trail.likelySpecies && trail.likelySpecies.includes(speciesId),
  );

  if (matchingTrails.length === 0) return [];

  // Step 2: Group by parkId and count
  const parkCountMap = new Map<string, number>();
  for (const trail of matchingTrails) {
    const count = parkCountMap.get(trail.parkId) ?? 0;
    parkCountMap.set(trail.parkId, count + 1);
  }

  // Step 3: Build a lookup map for parks
  const parkLookup = new Map<string, Park>();
  for (const park of parks) {
    parkLookup.set(park.id, park);
  }

  // Step 4: Resolve park names and regions, filter out unresolved parks
  const topParks: TopPark[] = [];
  parkCountMap.forEach((trailCount, parkId) => {
    const park = parkLookup.get(parkId);
    if (park) {
      topParks.push({
        id: park.id,
        name: park.name,
        region: park.region,
        trailCount,
      });
    }
  });

  // Step 5: Sort by trail count descending, then alphabetically by park name
  topParks.sort((a, b) => {
    if (b.trailCount !== a.trailCount) {
      return b.trailCount - a.trailCount;
    }
    return a.name.localeCompare(b.name);
  });

  // Step 6: Return top N
  return topParks.slice(0, maxParks);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook to compute top parks for a species from IndexedDB trails/parks stores.
 *
 * Returns loading state while fetching, then the computed top parks.
 * Returns empty array if no parks are associated with the species.
 */
export function useTopParks(speciesId: string): UseTopParksResult {
  const [parks, setParks] = useState<TopPark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchTopParks() {
      setLoading(true);

      try {
        // Fetch all trails from IndexedDB
        const allTrails = await getAllRecords('trails');

        // Filter trails that reference this species
        const matchingTrails = allTrails.filter(
          (trail) => trail.likelySpecies && trail.likelySpecies.includes(speciesId),
        );

        if (matchingTrails.length === 0) {
          if (!cancelled) {
            setParks([]);
            setLoading(false);
          }
          return;
        }

        // Get unique park IDs from matching trails
        const parkIdSet = new Set(matchingTrails.map((t) => t.parkId));
        const parkIds = Array.from(parkIdSet);

        // Batch fetch park records
        const parkRecords = await batchGetRecords('parks', parkIds);

        // Compute top parks using the pure function
        const result = computeTopParks(speciesId, allTrails, parkRecords);

        if (!cancelled) {
          setParks(result);
          setLoading(false);
        }
      } catch {
        // Gracefully handle IndexedDB errors
        if (!cancelled) {
          setParks([]);
          setLoading(false);
        }
      }
    }

    if (speciesId) {
      fetchTopParks();
    } else {
      setParks([]);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [speciesId]);

  return { parks, loading };
}
