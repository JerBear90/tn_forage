'use client';

import { useState, useCallback, useEffect } from 'react';
import { putRecord, getRecord } from '@/offline/db';

const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const REC_GOV_BASE_URL = 'https://ridb.recreation.gov/api/v1';

/**
 * Recreation.gov facility data.
 */
export interface RecGovFacility {
  id: string;
  name: string;
  type: string;
  description?: string;
  reservable: boolean;
  reservationUrl?: string;
}

/**
 * Recreation.gov park data.
 */
export interface RecGovParkData {
  facilities: RecGovFacility[];
  activities: string[];
  campsiteAvailability?: string;
  reservationUrl?: string;
  lastFetched: string;
}

/**
 * Recreation.gov integration hook that fetches park data,
 * caches with 24h expiration, and serves cached data offline.
 *
 * Requirements: 12.1–12.8
 */
export function useRecreationGov(parkName?: string) {
  const [data, setData] = useState<RecGovParkData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);

  /**
   * Fetches park data from recreation.gov API.
   * Falls back to cached data when offline or on API failure.
   */
  const fetchParkData = useCallback(async () => {
    if (!parkName) return;

    setIsLoading(true);
    const cacheKey = `recgov-${parkName.toLowerCase().replace(/\s+/g, '-')}`;

    try {
      // Check cache first
      const cached = await getCachedData(cacheKey);
      if (cached && !isCacheExpired(cached.lastFetched)) {
        setData(cached);
        setIsStale(false);
        setIsLoading(false);
        return;
      }

      // If online, fetch fresh data
      if (navigator.onLine) {
        const freshData = await fetchFromRecGov(parkName);
        if (freshData) {
          await cacheData(cacheKey, freshData);
          setData(freshData);
          setIsStale(false);
          setIsLoading(false);
          return;
        }
      }

      // Fall back to stale cache
      if (cached) {
        setData(cached);
        setIsStale(true);
      }
    } catch {
      // Try cached data on error
      const cached = await getCachedData(cacheKey);
      if (cached) {
        setData(cached);
        setIsStale(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [parkName]);

  // Load data on mount and when parkName changes
  useEffect(() => {
    fetchParkData();
  }, [fetchParkData]);

  return {
    data,
    isLoading,
    isStale,
    refresh: fetchParkData,
  };
}

/**
 * Fetches park data from the recreation.gov API.
 * Note: In production, this would use a proper API key.
 */
async function fetchFromRecGov(parkName: string): Promise<RecGovParkData | null> {
  try {
    // Recreation.gov API requires an API key for production use.
    // This is a placeholder implementation that returns structured data.
    // In production, replace with actual API calls using the RIDB API.
    const searchUrl = `${REC_GOV_BASE_URL}/facilities?query=${encodeURIComponent(parkName)}&state=TN&limit=5`;

    const response = await fetch(searchUrl, {
      headers: {
        Accept: 'application/json',
        // API key would go here in production
      },
    });

    if (!response.ok) return null;

    const result = await response.json();
    const facilities = (result?.RECDATA ?? []).map((f: Record<string, unknown>) => ({
      id: String(f.FacilityID ?? ''),
      name: String(f.FacilityName ?? ''),
      type: String(f.FacilityTypeDescription ?? ''),
      description: String(f.FacilityDescription ?? ''),
      reservable: Boolean(f.Reservable),
      reservationUrl: f.FacilityReservationURL ? String(f.FacilityReservationURL) : undefined,
    }));

    return {
      facilities,
      activities: [],
      lastFetched: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Caches recreation.gov data in IndexedDB.
 */
async function cacheData(key: string, data: RecGovParkData): Promise<void> {
  try {
    // Store in featureFlags store as a generic cache (reusing existing store)
    await putRecord('featureFlags', {
      featureKey: key,
      accessTier: 'free',
      label: 'RecGov Cache',
      description: JSON.stringify(data),
    } as never);
  } catch {
    // Silently fail
  }
}

/**
 * Retrieves cached recreation.gov data from IndexedDB.
 */
async function getCachedData(key: string): Promise<RecGovParkData | null> {
  try {
    const record = await getRecord('featureFlags', key);
    if (!record) return null;
    const desc = (record as { description?: string }).description;
    if (!desc) return null;
    return JSON.parse(desc) as RecGovParkData;
  } catch {
    return null;
  }
}

/**
 * Checks if cached data has expired (older than 24 hours).
 */
function isCacheExpired(lastFetched: string): boolean {
  const age = Date.now() - new Date(lastFetched).getTime();
  return age > CACHE_EXPIRY_MS;
}
