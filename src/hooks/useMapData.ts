'use client';

import { useState, useEffect } from 'react';
import type { Park, Trail, Route } from '@/types';
import { getAllRecords } from '@/offline/db';

export interface MapData {
  parks: Park[];
  trails: Trail[];
  routes: Route[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook that loads parks, trails, and routes from IndexedDB
 * for rendering on the Leaflet map.
 */
export function useMapData(): MapData {
  const [parks, setParks] = useState<Park[]>([]);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [parksData, trailsData, routesData] = await Promise.all([
          getAllRecords('parks'),
          getAllRecords('trails'),
          getAllRecords('routes'),
        ]);

        if (!cancelled) {
          setParks(parksData);
          setTrails(trailsData);
          setRoutes(routesData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load map data'
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

  return { parks, trails, routes, loading, error };
}
