"use client";

/**
 * ForageWise — useBatchRecords Hook
 *
 * Generic hook that reads multiple IndexedDB stores in parallel via
 * `Promise.all`. Returns records keyed by store name along with
 * loading and error states.
 *
 * This avoids sequential store reads and reduces total load time when
 * a page needs data from several stores at once.
 */

import { useState, useEffect, useRef } from "react";
import { getAllRecords, type StoreName } from "@/offline/db";

export interface UseBatchRecordsResult {
  /** Records keyed by store name. Each value is the full array from that store. */
  data: Record<string, unknown[]>;
  /** True while any store is still being read. */
  loading: boolean;
  /** Error message if any store read fails, otherwise null. */
  error: string | null;
}

/**
 * Hook that loads all records from the given IndexedDB stores in parallel.
 *
 * @param storeNames - Array of store names to read from IndexedDB.
 * @returns `{ data, loading, error }` where `data` maps each store name
 *          to its array of records.
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useBatchRecords(["species", "plants", "trees"]);
 * // data.species, data.plants, data.trees are available once loading is false
 * ```
 */
export function useBatchRecords(storeNames: StoreName[]): UseBatchRecordsResult {
  const [data, setData] = useState<Record<string, unknown[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stabilise the dependency — only re-run when the actual list of names changes
  const storeKey = storeNames.slice().sort().join(",");
  const storeNamesRef = useRef(storeNames);
  storeNamesRef.current = storeNames;

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        setLoading(true);
        setError(null);

        const names = storeNamesRef.current;

        // Read every store in parallel
        const results = await Promise.all(
          names.map((name) => getAllRecords(name))
        );

        if (cancelled) return;

        // Build a record keyed by store name
        const mapped: Record<string, unknown[]> = {};
        names.forEach((name, index) => {
          mapped[name] = results[index];
        });

        setData(mapped);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load batch records"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAll();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeKey]);

  return { data, loading, error };
}
