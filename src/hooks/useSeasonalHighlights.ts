"use client";

/**
 * ForageFlow — useSeasonalHighlights Hook
 *
 * Loads species from IndexedDB filtered by the current season.
 * Returns species with images, names, season, and habitat for
 * the seasonal highlights section on the home page.
 *
 * Season mapping:
 *   Spring: March–May (months 2–4)
 *   Summer: June–August (months 5–7)
 *   Fall: September–November (months 8–10)
 *   Winter: December–February (months 11, 0, 1)
 *
 * Requirements: 11.1
 */

import { useState, useEffect } from "react";
import { getAllRecords } from "@/offline/db";
import { seedDatabase } from "@/data/seedDatabase";
import type { Species, Plant } from "@/types";

/** Shape returned for each seasonal highlight */
export interface SeasonalHighlight {
  id: string;
  commonName: string;
  images: string[];
  season: string[];
  habitat: string;
}

export interface UseSeasonalHighlightsResult {
  highlights: SeasonalHighlight[];
  currentSeason: string;
  loading: boolean;
  error: string | null;
}

/**
 * Determine the current season based on the month.
 */
export function getCurrentSeason(date: Date = new Date()): string {
  const month = date.getMonth(); // 0-indexed: 0=Jan, 11=Dec
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Fall";
  return "Winter";
}

/**
 * Hook that loads species matching the current season from IndexedDB.
 * Seeds the database on first run if stores are empty.
 */
export function useSeasonalHighlights(): UseSeasonalHighlightsResult {
  const [highlights, setHighlights] = useState<SeasonalHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentSeason = getCurrentSeason();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Seed database if empty (idempotent)
        await seedDatabase();

        // Load species and plants (both have season arrays)
        const [species, plants] = await Promise.all([
          getAllRecords("species"),
          getAllRecords("plants"),
        ]);

        if (cancelled) return;

        // Filter to items that include the current season
        const seasonLower = currentSeason.toLowerCase();

        const matchingSpecies = (species as Species[]).filter((s) =>
          s.season.some((sz) => sz.toLowerCase() === seasonLower)
        );

        const matchingPlants = (plants as Plant[]).filter((p) =>
          p.season.some((sz) => sz.toLowerCase() === seasonLower)
        );

        // Combine and map to SeasonalHighlight shape
        const combined: SeasonalHighlight[] = [
          ...matchingSpecies.map((s) => ({
            id: s.id,
            commonName: s.commonName,
            images: s.images,
            season: s.season,
            habitat: s.habitat,
          })),
          ...matchingPlants.map((p) => ({
            id: p.id,
            commonName: p.commonName,
            images: p.images,
            season: p.season,
            habitat: p.habitat,
          })),
        ];

        // Sort alphabetically by name
        combined.sort((a, b) => a.commonName.localeCompare(b.commonName));

        setHighlights(combined);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load seasonal highlights"
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
  }, [currentSeason]);

  return { highlights, currentSeason, loading, error };
}
