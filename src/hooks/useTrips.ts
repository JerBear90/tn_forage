'use client';

/**
 * ForageFlow — useTrips Hook
 *
 * Loads all trips from IndexedDB and resolves location names from
 * parks, trails, and routes stores. Provides delete functionality.
 * Returns trips sorted by date (newest first).
 */

import { useState, useEffect, useCallback } from 'react';
import { getAllRecords, deleteRecord } from '@/offline/db';
import type { Trip, Park, Trail, Route } from '@/types';

/** A trip enriched with a resolved human-readable location name. */
export interface TripWithLocation extends Trip {
  locationName: string;
}

export interface UseTripsResult {
  trips: TripWithLocation[];
  loading: boolean;
  error: string | null;
  deleteTrip: (id: string) => Promise<void>;
  refresh: () => void;
}

/**
 * Build a lookup map from id → name for parks, trails, and routes.
 */
function buildLocationMap(
  parks: Park[],
  trails: Trail[],
  routes: Route[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of parks) map.set(p.id, p.name);
  for (const t of trails) map.set(t.id, t.name);
  for (const r of routes) map.set(r.id, r.name);
  return map;
}

/**
 * Resolve a trip's location to a human-readable name.
 */
function resolveLocationName(
  trip: Trip,
  locationMap: Map<string, string>,
): string {
  if (trip.locationType === 'custom') {
    return trip.customLocation || 'Custom Location';
  }
  if (trip.locationId) {
    return locationMap.get(trip.locationId) || trip.locationId;
  }
  return 'Unknown Location';
}

/**
 * Hook that loads all trips from IndexedDB, resolves location names,
 * and provides delete + refresh capabilities.
 */
export function useTrips(): UseTripsResult {
  const [trips, setTrips] = useState<TripWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [tripsData, parks, trails, routes] = await Promise.all([
          getAllRecords('trips'),
          getAllRecords('parks'),
          getAllRecords('trails'),
          getAllRecords('routes'),
        ]);

        if (cancelled) return;

        const locationMap = buildLocationMap(parks, trails, routes);

        const enriched: TripWithLocation[] = tripsData.map((trip) => ({
          ...trip,
          locationName: resolveLocationName(trip, locationMap),
        }));

        // Sort by date descending (newest first)
        enriched.sort((a, b) => b.date.localeCompare(a.date));

        setTrips(enriched);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load trips',
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
  }, [refreshKey]);

  const deleteTrip = useCallback(async (id: string) => {
    await deleteRecord('trips', id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return { trips, loading, error, deleteTrip, refresh };
}
