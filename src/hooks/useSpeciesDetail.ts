"use client";

/**
 * ForageFlow — useSpeciesDetail Hook
 *
 * Looks up a single species, plant, or tree record by ID from IndexedDB.
 * Tries each store in order: species → plants → trees.
 * Returns the full record with loading/error state and a discriminated
 * `kind` field so the detail page knows which type it received.
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
 * Hook that loads a single species/plant/tree record by ID from IndexedDB.
 * Seeds the database on first run if stores are empty.
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

        const result = await findRecordById(id);

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
