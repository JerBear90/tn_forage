"use client";

/**
 * ForageFlow — useAssociatedSpeciesLookup Hook
 *
 * Resolves an array of associated species names to their IndexedDB record IDs.
 * Searches across species, plants, and trees stores by commonName (case-insensitive).
 * Returns a map of { [speciesName]: speciesId | null }.
 *
 * Requirements: 12.1, 12.3
 */

import { useState, useEffect } from "react";
import { getAllRecords } from "@/offline/db";
import type { Species, Plant, Tree } from "@/types";

export type AssociatedSpeciesMap = Record<string, string | null>;

/**
 * Pure function that resolves associated species names to IDs by searching
 * across species, plants, and trees records by commonName (case-insensitive).
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
  const lookupMap = new Map<string, string>();

  for (const s of speciesRecords) {
    lookupMap.set(s.commonName.toLowerCase(), s.id);
  }
  for (const p of plantRecords) {
    lookupMap.set(p.commonName.toLowerCase(), p.id);
  }
  for (const t of treeRecords) {
    lookupMap.set(t.commonName.toLowerCase(), t.id);
  }

  for (const name of names) {
    const key = name.toLowerCase();
    result[name] = lookupMap.get(key) ?? null;
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
  }, [names.join(",")]);

  return lookupMap;
}
