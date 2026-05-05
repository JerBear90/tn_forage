"use client";

/**
 * ForageWise — useSpeciesDetail Hook
 *
 * Looks up a single species, plant, or tree record by ID from IndexedDB.
 * Tries each store in order: species → plants → trees.
 * Returns the full record with loading/error state and a discriminated
 * `kind` field so the detail page knows which type it received.
 *
 * Includes retry logic for IndexedDB hydration delay: if findRecordById
 * returns null on first attempt, retries up to 3 times with exponential
 * backoff (200ms, 400ms, 800ms) to handle direct URL navigation where
 * IndexedDB may not be fully initialized yet.
 *
 * Requirements: 17.1, 17.2, 17.3, 17.4
 */

import { useState, useEffect } from "react";
import { getRecord } from "@/offline/db";
import { seedDatabase } from "@/data/seedDatabase";
import type { Species, Plant, Tree } from "@/types";

export type SpeciesDetailRecord =
  | { kind: "species"; data: Species }
  | { kind: "plant"; data: Plant }
  | { kind: "tree"; data: Tree };

export interface UseSpeciesDetailResult {
  record: SpeciesDetailRecord | null;
  loading: boolean;
  error: string | null;
}

/** Retry configuration for IndexedDB hydration delay */
export const RETRY_DELAYS = [200, 400, 800] as const;
export const MAX_RETRIES = RETRY_DELAYS.length;

/**
 * Look up a record by ID across species, plants, and trees stores.
 * Returns the first match found (species → plants → trees).
 */
export async function findRecordById(
  id: string
): Promise<SpeciesDetailRecord | null> {
  const species = await getRecord("species", id);
  if (species) return { kind: "species", data: species };

  const plant = await getRecord("plants", id);
  if (plant) return { kind: "plant", data: plant };

  const tree = await getRecord("trees", id);
  if (tree) return { kind: "tree", data: tree };

  return null;
}

/**
 * Utility: wait for a given number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Look up a record by ID with retry logic for IndexedDB hydration delay.
 * If the first attempt returns null, retries up to 3 times with exponential
 * backoff (200ms, 400ms, 800ms).
 */
export async function findRecordByIdWithRetry(
  id: string
): Promise<SpeciesDetailRecord | null> {
  // First attempt
  const result = await findRecordById(id);
  if (result) return result;

  // Retry with exponential backoff
  for (const retryDelay of RETRY_DELAYS) {
    await delay(retryDelay);
    const retryResult = await findRecordById(id);
    if (retryResult) return retryResult;
  }

  return null;
}

/**
 * Hook that loads a single species/plant/tree record by ID from IndexedDB.
 * Seeds the database on first run if stores are empty.
 * Includes retry logic for IndexedDB hydration delay on direct URL navigation.
 */
export function useSpeciesDetail(id: string): UseSpeciesDetailResult {
  const [record, setRecord] = useState<SpeciesDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Seed database if empty (idempotent)
        await seedDatabase();

        // Use retry logic to handle IndexedDB hydration delay
        const result = await findRecordByIdWithRetry(id);

        if (cancelled) return;

        if (!result) {
          setError(`Species with ID "${id}" not found.`);
        } else {
          setRecord(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load species data"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { record, loading, error };
}
