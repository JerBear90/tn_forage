'use client';

import { useState, useCallback, useEffect } from 'react';
import { putRecord, getAllRecords, deleteRecord } from '@/offline/db';
import type {
  MicrohabitatPinRecord,
  MicrohabitatVisit,
  Coordinates,
  SlopeAspect,
  SubstrateType,
  MicrohabitatSyncPreference,
  WeatherSnapshot,
} from '@/types';

/**
 * Generates a unique microhabitat pin ID.
 */
function generatePinId(): string {
  return `mh-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Microhabitat mapping hook providing pin CRUD with visit history,
 * success rate calculation, and sync preference enforcement.
 *
 * Requirements: 28.1–28.9
 */
export function useMicrohabitats(userId: string) {
  const [pins, setPins] = useState<MicrohabitatPinRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Loads all microhabitat pins for the current user.
   */
  const loadPins = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await getAllRecords('microhabitatPins');
      const userPins = (all as MicrohabitatPinRecord[])
        .filter((p) => p.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPins(userPins);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Creates a new microhabitat pin.
   */
  const createPin = useCallback(
    async (params: {
      coordinates: Coordinates;
      slopeAspect?: SlopeAspect;
      nearWater: boolean;
      dominantTrees: string[];
      substrate: SubstrateType;
      notes: string;
      photos?: string[];
      associatedSpeciesId?: string;
      syncPreference?: MicrohabitatSyncPreference;
    }): Promise<MicrohabitatPinRecord> => {
      const pin: MicrohabitatPinRecord = {
        id: generatePinId(),
        userId,
        coordinates: params.coordinates,
        slopeAspect: params.slopeAspect,
        nearWater: params.nearWater,
        dominantTrees: params.dominantTrees,
        substrate: params.substrate,
        notes: params.notes,
        photos: params.photos ?? [],
        associatedSpeciesId: params.associatedSpeciesId,
        visits: [],
        syncPreference: params.syncPreference ?? 'local-only',
        syncStatus: params.syncPreference === 'sync' ? 'pending' : 'synced',
        createdAt: new Date().toISOString(),
      };

      await putRecord('microhabitatPins', pin);
      await loadPins();

      return pin;
    },
    [userId, loadPins],
  );

  /**
   * Records a visit to a microhabitat pin.
   */
  const recordVisit = useCallback(
    async (
      pinId: string,
      speciesFound: boolean,
      notes?: string,
      weather?: WeatherSnapshot,
    ): Promise<MicrohabitatPinRecord | null> => {
      const all = await getAllRecords('microhabitatPins');
      const pin = (all as MicrohabitatPinRecord[]).find((p) => p.id === pinId);
      if (!pin) return null;

      const visit: MicrohabitatVisit = {
        date: new Date().toISOString().split('T')[0],
        weather,
        speciesFound,
        notes,
      };

      const updated: MicrohabitatPinRecord = {
        ...pin,
        visits: [...pin.visits, visit],
        syncStatus: pin.syncPreference === 'sync' ? 'pending' : pin.syncStatus,
      };

      await putRecord('microhabitatPins', updated);
      await loadPins();

      return updated;
    },
    [loadPins],
  );

  /**
   * Calculates the success rate for a pin (percentage of visits where species was found).
   */
  const getSuccessRate = useCallback((pin: MicrohabitatPinRecord): number => {
    if (pin.visits.length === 0) return 0;
    const successCount = pin.visits.filter((v) => v.speciesFound).length;
    return Math.round((successCount / pin.visits.length) * 100);
  }, []);

  /**
   * Updates the sync preference for a pin.
   */
  const updateSyncPreference = useCallback(
    async (pinId: string, preference: MicrohabitatSyncPreference) => {
      const all = await getAllRecords('microhabitatPins');
      const pin = (all as MicrohabitatPinRecord[]).find((p) => p.id === pinId);
      if (!pin) return;

      const updated: MicrohabitatPinRecord = {
        ...pin,
        syncPreference: preference,
        syncStatus: preference === 'sync' ? 'pending' : 'synced',
      };

      await putRecord('microhabitatPins', updated);
      await loadPins();
    },
    [loadPins],
  );

  /**
   * Deletes a microhabitat pin.
   */
  const deletePin = useCallback(
    async (pinId: string) => {
      await deleteRecord('microhabitatPins', pinId);
      await loadPins();
    },
    [loadPins],
  );

  // Load pins on mount
  useEffect(() => {
    loadPins();
  }, [loadPins]);

  return {
    pins,
    isLoading,
    createPin,
    recordVisit,
    getSuccessRate,
    updateSyncPreference,
    deletePin,
    loadPins,
  };
}
