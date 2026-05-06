"use client";

/**
 * ForageWise — useAssociatedSpeciesLookup Hook
 *
 * Resolves an array of associated species names to their IndexedDB record IDs.
 * Searches across species, plants, and trees stores by commonName (case-insensitive).
 * Returns a map of { [speciesName]: speciesId | null }.
 *
 * Requirements: 12.1, 12.3
 */

import { useState, useEffect, useMemo } from "react";
import { getAllRecords } from "@/offline/db";
import type { Species, Plant, Tree } from "@/types";

export type AssociatedSpeciesMap = Record<string, string | null>;

/**
 * Pure function that resolves associated species names to IDs by searching
 * across species, plants, and trees records by commonName.
 *
 * Uses exact match first (case-insensitive), then falls back to partial
 * matching where the association name appears as a word in the commonName
 * (e.g. "Oak" matches "White Oak", "Northern Red Oak", etc.).
 * When multiple partial matches exist, returns the first match found.
 *
 * Exported for testing.
 */
export function resolveAssociatedSpecies(
  names: string[],
  speciesRecords: Species[],
  plantRecords: Plant[],
  treeRecords: Tree[]
): AssociatedSpeciesMap {
  const result: AssociatedSpeciesMap = Object.create(null);

  // Build a lookup map of lowercase commonName → id across all stores
  const exactMap = new Map<string, string>();
  // Also keep the full records for partial matching
  const allRecords: Array<{ commonName: string; id: string }> = [];

  for (const s of speciesRecords) {
    exactMap.set(s.commonName.toLowerCase(), s.id);
    allRecords.push({ commonName: s.commonName, id: s.id });
  }
  for (const p of plantRecords) {
    exactMap.set(p.commonName.toLowerCase(), p.id);
    allRecords.push({ commonName: p.commonName, id: p.id });
  }
  for (const t of treeRecords) {
    exactMap.set(t.commonName.toLowerCase(), t.id);
    allRecords.push({ commonName: t.commonName, id: t.id });
  }

  for (const name of names) {
    const key = name.toLowerCase();

    // 1. Exact match
    const exactId = exactMap.get(key);
    if (exactId) {
      result[name] = exactId;
      continue;
    }

    // 2. Partial match — association name appears as a word boundary in commonName
    //    e.g. "Oak" matches "White Oak", "Northern Red Oak", "Black Oak"
    const partialMatch = allRecords.find((r) => {
      const cn = r.commonName.toLowerCase();
      // Check if the name appears as a whole word in the commonName
      const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(cn);
    });

    result[name] = partialMatch?.id ?? null;
  }

  return result;
}

/**
 * Hook that resolves associated species names to their IndexedDB record IDs.
 * Searches species, plants, and trees stores by commonName (case-insensitive).
 */
export function useAssociatedSpeciesLookup(
  names: string[]
): AssociatedSpeciesMap {
  const [lookupMap, setLookupMap] = useState<AssociatedSpeciesMap>({});
  const namesKey = useMemo(() => names.join(","), [names]);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (names.length === 0) {
        setLookupMap({});
        return;
      }

      try {
        const [speciesRecords, plantRecords, treeRecords] = await Promise.all([
          getAllRecords("species"),
          getAllRecords("plants"),
          getAllRecords("trees"),
        ]);

        if (cancelled) return;

        const resolved = resolveAssociatedSpecies(
          names,
          speciesRecords,
          plantRecords,
          treeRecords
        );

        setLookupMap(resolved);
      } catch {
        // On error, return null for all names (graceful degradation per Req 12.3)
        if (!cancelled) {
          const fallback: AssociatedSpeciesMap = Object.create(null);
          for (const name of names) {
            fallback[name] = null;
          }
          setLookupMap(fallback);
        }
      }
    }

    resolve();

    return () => {
      cancelled = true;
    };
    // namesKey is a stable string derived from the names array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namesKey]);

  return lookupMap;
}
