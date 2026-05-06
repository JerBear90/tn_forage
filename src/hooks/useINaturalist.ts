'use client';

/**
 * ForageWise — useINaturalist Hook
 *
 * React hook for fetching iNaturalist data for a species.
 * Returns observation count, seasonality, and community photos.
 * Only fetches when online.
 */

import { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
  getSpeciesInfo,
  getSeasonality,
  type INatSpeciesInfo,
  type INatSeasonality,
} from '@/services/iNaturalistService';

export interface INaturalistData {
  info: INatSpeciesInfo | null;
  seasonality: INatSeasonality[];
  loading: boolean;
}

export function useINaturalist(scientificName: string | undefined): INaturalistData {
  const isOnline = useOnlineStatus();
  const [info, setInfo] = useState<INatSpeciesInfo | null>(null);
  const [seasonality, setSeasonality] = useState<INatSeasonality[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!scientificName || !isOnline) return;

    let cancelled = false;
    setLoading(true);

    async function fetchData() {
      const [infoResult, seasonResult] = await Promise.all([
        getSpeciesInfo(scientificName!),
        getSeasonality(scientificName!),
      ]);

      if (!cancelled) {
        setInfo(infoResult);
        setSeasonality(seasonResult);
        setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [scientificName, isOnline]);

  return { info, seasonality, loading };
}
