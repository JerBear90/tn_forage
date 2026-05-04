'use client';

import { useState, useCallback, useEffect } from 'react';
import { getAllRecords, putRecord } from '@/offline/db';
import { fetchCurrentWeather } from '@/utils/weatherService';
import { generateFruitingPredictions, type SpeciesForecastInput } from '@/utils/fruitingForecast';
import type { FruitingPrediction, Coordinates, Species } from '@/types';

const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fruiting forecast hook that fetches weather, runs predictions,
 * and caches results. Updates daily when online.
 *
 * Requirements: 25.1–25.8
 */
export function useFruitingForecast(coordinates?: Coordinates) {
  const [predictions, setPredictions] = useState<FruitingPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  /**
   * Loads cached predictions from IndexedDB.
   */
  const loadCachedPredictions = useCallback(async () => {
    try {
      const cached = await getAllRecords('fruitingForecasts');
      const validPredictions = (cached as FruitingPrediction[]).filter(
        (p) => p.speciesId !== '__weather_cache__',
      );

      if (validPredictions.length > 0) {
        setPredictions(validPredictions);
        setLastUpdated(validPredictions[0]?.lastUpdated ?? null);
      }
    } catch {
      // Silently fail
    }
  }, []);

  /**
   * Generates fresh predictions by fetching weather and running the forecast algorithm.
   */
  const refreshPredictions = useCallback(async () => {
    if (!coordinates) return;

    setIsLoading(true);
    try {
      // Fetch current weather
      const weather = await fetchCurrentWeather(coordinates);
      if (!weather) {
        // Fall back to cached predictions
        await loadCachedPredictions();
        return;
      }

      // Get species with fruiting triggers from IndexedDB
      const allSpecies = await getAllRecords('species');
      const speciesWithTriggers: SpeciesForecastInput[] = (allSpecies as Species[])
        .filter((s) => s.fruitingTriggers)
        .map((s) => ({
          speciesId: s.id,
          commonName: s.commonName,
          image: s.images?.[0],
          triggers: s.fruitingTriggers!,
        }));

      if (speciesWithTriggers.length === 0) {
        setIsLoading(false);
        return;
      }

      // Generate predictions
      const newPredictions = generateFruitingPredictions(speciesWithTriggers, weather);

      // Cache predictions in IndexedDB
      for (const prediction of newPredictions) {
        await putRecord('fruitingForecasts', {
          ...prediction,
          id: `forecast-${prediction.speciesId}`,
        } as never);
      }

      setPredictions(newPredictions);
      setLastUpdated(new Date().toISOString());
    } catch {
      // Fall back to cached predictions
      await loadCachedPredictions();
    } finally {
      setIsLoading(false);
    }
  }, [coordinates, loadCachedPredictions]);

  /**
   * Checks if cached predictions are stale and need refreshing.
   */
  const needsRefresh = useCallback((): boolean => {
    if (!lastUpdated) return true;
    const age = Date.now() - new Date(lastUpdated).getTime();
    return age > CACHE_MAX_AGE_MS;
  }, [lastUpdated]);

  // Load cached predictions on mount, refresh if stale and online
  useEffect(() => {
    async function init() {
      await loadCachedPredictions();

      if (coordinates && navigator.onLine && needsRefresh()) {
        await refreshPredictions();
      }
    }
    init();
  }, [coordinates, loadCachedPredictions, refreshPredictions, needsRefresh]);

  return {
    predictions,
    isLoading,
    lastUpdated,
    refreshPredictions,
    needsRefresh,
  };
}
