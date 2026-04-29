"use client";

/**
 * ForageFlow — useSpecies Hook
 *
 * Loads all species (mushrooms), plants, and trees from IndexedDB on mount.
 * Seeds the database if stores are empty (first run).
 * Returns a combined list with a unified shape for the Field Guide list page.
 */

import { useState, useEffect } from "react";
import { getAllRecords } from "@/offline/db";
import { seedDatabase } from "@/data/seedDatabase";
import type { Species, Plant, Tree, SpeciesCategory, EdibilityLabel } from "@/types";

/** Unified item shape for the Field Guide list */
export interface FieldGuideItem {
  id: string;
  commonName: string;
  scientificName: string;
  category: SpeciesCategory;
  images: string[];
  edibilityLabel: EdibilityLabel;
  season: string[];
  habitat: string;
  treeAssociations: string[];
}

export interface UseSpeciesResult {
  items: FieldGuideItem[];
  loading: boolean;
  error: string | null;
}

/**
 * Normalize a Species (mushroom) record into a FieldGuideItem.
 */
function speciesTo(s: Species): FieldGuideItem {
  return {
    id: s.id,
    commonName: s.commonName,
    scientificName: s.scientificName,
    category: s.category,
    images: s.images,
    edibilityLabel: s.edibilityLabel,
    season: s.season,
    habitat: s.habitat,
    treeAssociations: s.treeAssociations,
  };
}

/**
 * Normalize a Plant record into a FieldGuideItem.
 */
function plantTo(p: Plant): FieldGuideItem {
  return {
    id: p.id,
    commonName: p.commonName,
    scientificName: p.scientificName,
    category: "plant",
    images: p.images,
    edibilityLabel: p.edibilityLabel,
    season: p.season,
    habitat: p.habitat,
    treeAssociations: p.treeAssociations,
  };
}

/**
 * Normalize a Tree record into a FieldGuideItem.
 * Trees don't have edibilityLabel or season in the schema,
 * so we default to "unknown" and empty season.
 */
function treeTo(t: Tree): FieldGuideItem {
  return {
    id: t.id,
    commonName: t.commonName,
    scientificName: t.scientificName,
    category: "tree",
    images: t.images,
    edibilityLabel: "unknown" as EdibilityLabel,
    season: [],
    habitat: t.habitat,
    treeAssociations: t.associatedSpecies,
  };
}

/**
 * Hook that loads all species, plants, and trees from IndexedDB.
 * Seeds the database on first run if stores are empty.
 */
export function useSpecies(): UseSpeciesResult {
  const [items, setItems] = useState<FieldGuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Seed database if empty (idempotent)
        await seedDatabase();

        // Load all records from each store
        const [species, plants, trees] = await Promise.all([
          getAllRecords("species"),
          getAllRecords("plants"),
          getAllRecords("trees"),
        ]);

        if (cancelled) return;

        // Combine and normalize into a unified list
        const combined: FieldGuideItem[] = [
          ...species.map(speciesTo),
          ...plants.map(plantTo),
          ...trees.map(treeTo),
        ];

        // Sort alphabetically by commonName
        combined.sort((a, b) => a.commonName.localeCompare(b.commonName));

        setItems(combined);
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
  }, []);

  return { items, loading, error };
}
