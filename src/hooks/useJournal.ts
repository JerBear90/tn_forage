'use client';

import { useState, useCallback, useEffect } from 'react';
import { putRecord, getAllRecords, deleteRecord } from '@/offline/db';
import { fetchCurrentWeather } from '@/utils/weatherService';
import type { JournalEntry, WeatherSnapshot, Coordinates } from '@/types';

/**
 * Generates a unique journal entry ID.
 */
function generateEntryId(): string {
  return `journal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Foraging journal hook providing CRUD operations for journal entries
 * with automatic weather attachment and pattern analysis.
 *
 * Requirements: 24.1–24.8
 */
export function useJournal(userId: string) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Loads all journal entries for the current user.
   */
  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await getAllRecords('journalEntries');
      const userEntries = (all as JournalEntry[])
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
   * Creates a new journal entry with automatic weather attachment.
   */
  const createEntry = useCallback(
    async (params: {
      speciesId?: string;
      speciesGuess?: string;
      coordinates: Coordinates;
      notes: string;
      photos?: string[];
      visibility?: 'private' | 'public';
    }) => {
      const now = new Date();

      // Fetch current weather for the location
      let weather: WeatherSnapshot = {
        temperatureF: 0,
        humidity: 0,
        recentRainfallInches: 0,
        conditions: 'Unknown',
        fetchedAt: now.toISOString(),
      };

      try {
        const fetched = await fetchCurrentWeather(params.coordinates);
        if (fetched) {
          weather = fetched;
        }
      } catch {
        // Use default weather if fetch fails
      }

      const entry: JournalEntry = {
        id: generateEntryId(),
        userId,
        speciesId: params.speciesId,
        speciesGuess: params.speciesGuess,
        coordinates: params.coordinates,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        weather,
        photos: params.photos ?? [],
        notes: params.notes,
        visibility: params.visibility ?? 'private',
        syncStatus: 'pending',
        createdAt: now.toISOString(),
      };

      await putRecord('journalEntries', entry);
      await loadEntries();

      return entry;
    },
    [userId, loadEntries],
  );

  /**
   * Updates an existing journal entry.
   */
  const updateEntry = useCallback(
    async (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'userId' | 'createdAt'>>) => {
      const all = await getAllRecords('journalEntries');
      const existing = (all as JournalEntry[]).find((e) => e.id === id);
      if (!existing) return null;

      const updated: JournalEntry = {
        ...existing,
        ...updates,
        syncStatus: 'pending',
      };

      await putRecord('journalEntries', updated);
      await loadEntries();

      return updated;
    },
    [loadEntries],
  );

  /**
   * Deletes a journal entry.
   */
  const deleteEntry = useCallback(
    async (id: string) => {
      await deleteRecord('journalEntries', id);
      await loadEntries();
    },
    [loadEntries],
  );

  /**
   * Analyzes patterns in journal entries.
   * Finds correlations between species finds and weather conditions.
   */
  const analyzePatterns = useCallback(() => {
    if (entries.length < 3) return null;

    // Group entries by species
    const bySpecies = new Map<string, JournalEntry[]>();
    for (const entry of entries) {
      const key = entry.speciesId ?? entry.speciesGuess ?? 'unknown';
      const group = bySpecies.get(key) ?? [];
      group.push(entry);
      bySpecies.set(key, group);
    }

    // Calculate average conditions per species
    const patterns: Array<{
      species: string;
      avgTempF: number;
      avgHumidity: number;
      avgRainfall: number;
      findCount: number;
    }> = [];

    for (const [species, speciesEntries] of bySpecies.entries()) {
      if (speciesEntries.length < 2) continue;

      const avgTempF =
        speciesEntries.reduce((sum, e) => sum + e.weather.temperatureF, 0) /
        speciesEntries.length;
      const avgHumidity =
        speciesEntries.reduce((sum, e) => sum + e.weather.humidity, 0) /
        speciesEntries.length;
      const avgRainfall =
        speciesEntries.reduce((sum, e) => sum + e.weather.recentRainfallInches, 0) /
        speciesEntries.length;

      patterns.push({
        species,
        avgTempF: Math.round(avgTempF),
        avgHumidity: Math.round(avgHumidity),
        avgRainfall: Math.round(avgRainfall * 10) / 10,
        findCount: speciesEntries.length,
      });
    }

    return patterns.sort((a, b) => b.findCount - a.findCount);
  }, [entries]);

  // Load entries on mount
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  return {
    entries,
    isLoading,
    createEntry,
    updateEntry,
    deleteEntry,
    analyzePatterns,
    loadEntries,
  };
}
