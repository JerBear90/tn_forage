'use client';

import { useState, useCallback, useEffect } from 'react';
import { putRecord, getAllRecords, deleteRecord } from '@/offline/db';
import {
  generateLocationHash,
  calculateSustainabilityLevel,
} from '@/utils/harvestSustainability';
import type { HarvestEntry, SustainabilityLevel, Coordinates } from '@/types';

/**
 * Generates a unique harvest entry ID.
 */
function generateHarvestId(): string {
  return `harvest-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Gets the current season name based on month.
 */
function getCurrentSeason(month: number): string {
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

/**
 * Harvest log hook providing CRUD operations with sustainability calculation
 * and seasonal summary generation.
 *
 * Requirements: 27.1–27.7
 */
export function useHarvestLog(userId: string) {
  const [entries, setEntries] = useState<HarvestEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Loads all harvest entries for the current user.
   */
  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await getAllRecords('harvestEntries');
      const userEntries = (all as HarvestEntry[])
        .filter((e) => e.userId === userId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEntries(userEntries);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Creates a new harvest entry with automatic sustainability calculation.
   */
  const logHarvest = useCallback(
    async (params: {
      speciesId?: string;
      speciesGuess?: string;
      quantity: string;
      coordinates: Coordinates;
      notes?: string;
    }): Promise<{ entry: HarvestEntry; sustainability: SustainabilityLevel }> => {
      const now = new Date();
      const locationHash = generateLocationHash(params.coordinates);

      const entry: HarvestEntry = {
        id: generateHarvestId(),
        userId,
        speciesId: params.speciesId,
        speciesGuess: params.speciesGuess,
        quantity: params.quantity,
        coordinates: params.coordinates,
        locationHash,
        date: now.toISOString().split('T')[0],
        season: getCurrentSeason(now.getMonth()),
        notes: params.notes,
        syncStatus: 'pending',
      };

      await putRecord('harvestEntries', entry);

      // Calculate sustainability for this location
      const sustainability = await getSustainabilityForLocation(locationHash);

      await loadEntries();

      return { entry, sustainability };
    },
    [userId, loadEntries],
  );

  /**
   * Calculates sustainability level for a given location hash.
   * Counts harvests in the same grid cell within the last 30 days.
   */
  const getSustainabilityForLocation = useCallback(
    async (locationHash: string): Promise<SustainabilityLevel> => {
      const all = await getAllRecords('harvestEntries');
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

      const recentInArea = (all as HarvestEntry[]).filter(
        (e) =>
          e.locationHash === locationHash &&
          new Date(e.date).getTime() >= thirtyDaysAgo,
      );

      return calculateSustainabilityLevel(recentInArea.length);
    },
    [],
  );

  /**
   * Deletes a harvest entry.
   */
  const deleteHarvest = useCallback(
    async (id: string) => {
      await deleteRecord('harvestEntries', id);
      await loadEntries();
    },
    [loadEntries],
  );

  /**
   * Generates a seasonal summary of harvests.
   */
  const getSeasonalSummary = useCallback(() => {
    const bySeason = new Map<string, { count: number; species: Set<string> }>();

    for (const entry of entries) {
      const existing = bySeason.get(entry.season) ?? { count: 0, species: new Set<string>() };
      existing.count++;
      if (entry.speciesId) existing.species.add(entry.speciesId);
      if (entry.speciesGuess) existing.species.add(entry.speciesGuess);
      bySeason.set(entry.season, existing);
    }

    return Array.from(bySeason.entries()).map(([season, data]) => ({
      season,
      harvestCount: data.count,
      uniqueSpecies: data.species.size,
    }));
  }, [entries]);

  // Load entries on mount
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  return {
    entries,
    isLoading,
    logHarvest,
    deleteHarvest,
    getSustainabilityForLocation,
    getSeasonalSummary,
    loadEntries,
  };
}
