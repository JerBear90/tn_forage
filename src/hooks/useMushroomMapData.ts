'use client';

import { useState, useEffect } from 'react';
import type { Trail, Park, Species } from '@/types';
import { getAllRecords } from '@/offline/db';
import { isInSeasonForMonth, getCurrentMonth, type MonthIndex } from '@/utils/seasonHelpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MushroomLocationMarker {
  id: string;
  type: 'park' | 'trail';
  name: string;
  parkName?: string;
  coordinates: { lat: number; lng: number };
  mushroomSpecies: Array<{
    id: string;
    commonName: string;
    inSeason: boolean;
  }>;
}

export interface UseMushroomMapDataResult {
  markers: MushroomLocationMarker[];
  loading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Filter trails to those whose `likelySpecies` contains at least one
 * mushroom species ID from the provided set.
 */
export function filterMushroomTrails(
  trails: Trail[],
  mushroomSpeciesIds: Set<string>,
): Trail[] {
  return trails.filter((trail) =>
    trail.likelySpecies.some((id) => mushroomSpeciesIds.has(id)),
  );
}

/**
 * Build deduplicated park and trail markers from the filtered data.
 */
export function buildMarkers(
  mushroomTrails: Trail[],
  parks: Park[],
  speciesMap: Map<string, Species>,
  currentMonth: MonthIndex,
): MushroomLocationMarker[] {
  const parkMap = new Map<string, Park>();
  for (const park of parks) {
    parkMap.set(park.id, park);
  }

  const markers: MushroomLocationMarker[] = [];

  // Track which parks have qualifying trails for deduplication
  const parkMushroomSpecies = new Map<string, Set<string>>();

  // Build trail markers and collect park-level species
  for (const trail of mushroomTrails) {
    const park = parkMap.get(trail.parkId);

    // Resolve mushroom species for this trail
    const resolvedSpecies: MushroomLocationMarker['mushroomSpecies'] = [];
    for (const speciesId of trail.likelySpecies) {
      const species = speciesMap.get(speciesId);
      if (species && species.category === 'mushroom') {
        resolvedSpecies.push({
          id: species.id,
          commonName: species.commonName,
          inSeason: isInSeasonForMonth(species.season, currentMonth),
        });
      }
    }

    if (resolvedSpecies.length === 0) continue;

    // Trail marker — use first coordinate as the marker position
    if (trail.coordinates.length > 0) {
      markers.push({
        id: `trail-${trail.id}`,
        type: 'trail',
        name: trail.name,
        parkName: park?.name,
        coordinates: {
          lat: trail.coordinates[0].lat,
          lng: trail.coordinates[0].lng,
        },
        mushroomSpecies: resolvedSpecies,
      });
    }

    // Accumulate species for the parent park
    if (trail.parkId) {
      if (!parkMushroomSpecies.has(trail.parkId)) {
        parkMushroomSpecies.set(trail.parkId, new Set());
      }
      const parkSpeciesSet = parkMushroomSpecies.get(trail.parkId)!;
      for (const sp of resolvedSpecies) {
        parkSpeciesSet.add(sp.id);
      }
    }
  }

  // Build deduplicated park markers
  for (const [parkId, speciesIds] of Array.from(parkMushroomSpecies)) {
    const park = parkMap.get(parkId);
    if (!park) continue;

    const resolvedSpecies: MushroomLocationMarker['mushroomSpecies'] = [];
    for (const speciesId of Array.from(speciesIds)) {
      const species = speciesMap.get(speciesId);
      if (species) {
        resolvedSpecies.push({
          id: species.id,
          commonName: species.commonName,
          inSeason: isInSeasonForMonth(species.season, currentMonth),
        });
      }
    }

    markers.push({
      id: `park-${park.id}`,
      type: 'park',
      name: park.name,
      coordinates: {
        lat: park.coordinates.lat,
        lng: park.coordinates.lng,
      },
      mushroomSpecies: resolvedSpecies,
    });
  }

  return markers;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Loads trails, parks, and species from IndexedDB and builds
 * MushroomLocationMarker[] for the mushroom map layer.
 *
 * Requirements: 5.2, 5.3, 5.7, 6.1, 6.2, 6.6
 */
export function useMushroomMapData(): UseMushroomMapDataResult {
  const [markers, setMarkers] = useState<MushroomLocationMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [trails, parks, species] = await Promise.all([
          getAllRecords('trails'),
          getAllRecords('parks'),
          getAllRecords('species'),
        ]);

        if (cancelled) return;

        // Build a map of mushroom species by ID
        const speciesMap = new Map<string, Species>();
        const mushroomSpeciesIds = new Set<string>();
        for (const sp of species) {
          if (sp.category === 'mushroom') {
            speciesMap.set(sp.id, sp);
            mushroomSpeciesIds.add(sp.id);
          }
        }

        // Filter trails to those with at least one mushroom species
        const mushroomTrails = filterMushroomTrails(
          trails as Trail[],
          mushroomSpeciesIds,
        );

        // Build markers
        const currentMonth = getCurrentMonth();
        const builtMarkers = buildMarkers(
          mushroomTrails,
          parks as Park[],
          speciesMap,
          currentMonth,
        );

        if (!cancelled) {
          setMarkers(builtMarkers);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load mushroom map data',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  return { markers, loading, error };
}
