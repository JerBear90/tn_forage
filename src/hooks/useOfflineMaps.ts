'use client';

import { useState, useCallback } from 'react';
import { putRecord, getAllRecords, deleteRecord, getDB } from '@/offline/db';
import type { DownloadedMapRegion } from '@/types';

/**
 * Download progress state.
 */
export interface DownloadProgress {
  isDownloading: boolean;
  percentage: number;
  tilesDownloaded: number;
  totalTiles: number;
  estimatedSecondsRemaining: number;
}

/**
 * Bounds for a map region.
 */
export interface RegionBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

const MIN_ZOOM = 10;
const MAX_ZOOM = 16;
const TILE_URL_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/**
 * Calculates the number of tiles needed for a region at given zoom levels.
 */
function calculateTileCount(bounds: RegionBounds, minZoom: number, maxZoom: number): number {
  let total = 0;
  for (let z = minZoom; z <= maxZoom; z++) {
    const n = Math.pow(2, z);
    const xMin = Math.floor(((bounds.west + 180) / 360) * n);
    const xMax = Math.floor(((bounds.east + 180) / 360) * n);
    const yMin = Math.floor(
      ((1 - Math.log(Math.tan((bounds.north * Math.PI) / 180) + 1 / Math.cos((bounds.north * Math.PI) / 180)) / Math.PI) / 2) * n,
    );
    const yMax = Math.floor(
      ((1 - Math.log(Math.tan((bounds.south * Math.PI) / 180) + 1 / Math.cos((bounds.south * Math.PI) / 180)) / Math.PI) / 2) * n,
    );
    total += (xMax - xMin + 1) * (yMax - yMin + 1);
  }
  return total;
}

/**
 * Generates tile URLs for a region at given zoom levels.
 */
function* generateTileUrls(
  bounds: RegionBounds,
  minZoom: number,
  maxZoom: number,
): Generator<string> {
  for (let z = minZoom; z <= maxZoom; z++) {
    const n = Math.pow(2, z);
    const xMin = Math.floor(((bounds.west + 180) / 360) * n);
    const xMax = Math.floor(((bounds.east + 180) / 360) * n);
    const yMin = Math.floor(
      ((1 - Math.log(Math.tan((bounds.north * Math.PI) / 180) + 1 / Math.cos((bounds.north * Math.PI) / 180)) / Math.PI) / 2) * n,
    );
    const yMax = Math.floor(
      ((1 - Math.log(Math.tan((bounds.south * Math.PI) / 180) + 1 / Math.cos((bounds.south * Math.PI) / 180)) / Math.PI) / 2) * n,
    );

    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        yield TILE_URL_TEMPLATE.replace('{z}', String(z))
          .replace('{x}', String(x))
          .replace('{y}', String(y));
      }
    }
  }
}

/**
 * Offline maps hook for downloading, managing, and deleting map tile regions.
 *
 * - Tile download orchestration for zoom levels 10-16
 * - Progress tracking (percentage + estimated time)
 * - Region management (list, delete)
 *
 * Requirements: 7.1–7.8
 */
export function useOfflineMaps() {
  const [progress, setProgress] = useState<DownloadProgress>({
    isDownloading: false,
    percentage: 0,
    tilesDownloaded: 0,
    totalTiles: 0,
    estimatedSecondsRemaining: 0,
  });
  const [regions, setRegions] = useState<DownloadedMapRegion[]>([]);

  /**
   * Downloads map tiles for a specified region.
   */
  const downloadRegion = useCallback(
    async (name: string, bounds: RegionBounds, parkIds: string[] = [], trailIds: string[] = []) => {
      const totalTiles = calculateTileCount(bounds, MIN_ZOOM, MAX_ZOOM);
      const startTime = Date.now();
      let tilesDownloaded = 0;
      let totalBytes = 0;

      setProgress({
        isDownloading: true,
        percentage: 0,
        tilesDownloaded: 0,
        totalTiles,
        estimatedSecondsRemaining: 0,
      });

      const db = await getDB();
      const regionId = `region-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      // Download tiles in batches
      const BATCH_SIZE = 10;
      const tileUrls = [...generateTileUrls(bounds, MIN_ZOOM, MAX_ZOOM)];

      for (let i = 0; i < tileUrls.length; i += BATCH_SIZE) {
        const batch = tileUrls.slice(i, i + BATCH_SIZE);

        const results = await Promise.allSettled(
          batch.map(async (url) => {
            const response = await fetch(url);
            if (!response.ok) return null;
            const blob = await response.blob();
            return { url, blob };
          }),
        );

        // Store successful downloads
        const tx = db.transaction('mapTiles', 'readwrite');
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            await tx.store.put({
              url: result.value.url,
              regionId,
              blob: result.value.blob,
              cachedAt: new Date().toISOString(),
            });
            totalBytes += result.value.blob.size;
            tilesDownloaded++;
          }
        }
        await tx.done;

        // Update progress
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = tilesDownloaded / elapsed;
        const remaining = Math.ceil((totalTiles - tilesDownloaded) / rate);

        setProgress({
          isDownloading: true,
          percentage: Math.round((tilesDownloaded / totalTiles) * 100),
          tilesDownloaded,
          totalTiles,
          estimatedSecondsRemaining: remaining,
        });
      }

      // Save region metadata
      const region: DownloadedMapRegion = {
        id: regionId,
        name,
        bounds,
        zoomLevels: { min: MIN_ZOOM, max: MAX_ZOOM },
        tileCount: tilesDownloaded,
        sizeBytes: totalBytes,
        downloadedAt: new Date().toISOString(),
        parkIds,
        trailIds,
      };

      await putRecord('downloadedMapRegions', region);

      setProgress({
        isDownloading: false,
        percentage: 100,
        tilesDownloaded,
        totalTiles,
        estimatedSecondsRemaining: 0,
      });

      // Refresh regions list
      await loadRegions();

      return region;
    },
    [],
  );

  /**
   * Loads all downloaded regions from IndexedDB.
   */
  const loadRegions = useCallback(async () => {
    const allRegions = await getAllRecords('downloadedMapRegions');
    setRegions(allRegions as DownloadedMapRegion[]);
  }, []);

  /**
   * Deletes a downloaded region and its associated tiles.
   */
  const deleteRegion = useCallback(async (regionId: string) => {
    // Delete the region metadata
    await deleteRecord('downloadedMapRegions', regionId);

    // Delete associated tiles
    const db = await getDB();
    const tx = db.transaction('mapTiles', 'readwrite');
    const index = tx.store.index('by-regionId');
    let cursor = await index.openCursor(regionId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;

    // Refresh regions list
    await loadRegions();
  }, [loadRegions]);

  return {
    progress,
    regions,
    downloadRegion,
    loadRegions,
    deleteRegion,
  };
}
