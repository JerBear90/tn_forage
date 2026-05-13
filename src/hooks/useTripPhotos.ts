'use client';

/**
 * ForageWise — useTripPhotos Hook
 *
 * Manages trip photo attachments: add, remove, list photos for a trip.
 * Enforces a 10-photo limit per trip. Stores photos in IndexedDB when
 * offline and syncs to PocketBase when online. Listens for online events
 * to trigger sync within 30 seconds of reconnection per photo.
 *
 * Uses `compressPhoto` and `syncPhotoToPocketBase` from tripPhotoService.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllRecords, putRecord, deleteRecord } from '@/offline/db';
import {
  compressPhoto,
  syncPhotoToPocketBase,
  isAcceptedPhotoFormat,
} from '@/services/tripPhotoService';
import type { TripPhoto } from '@/services/tripPhotoService';
import type { Photo, SyncStatus } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_PHOTOS_PER_TRIP = 10;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseTripPhotosResult {
  photos: TripPhoto[];
  loading: boolean;
  addPhotos: (files: File[]) => Promise<void>;
  removePhoto: (photoId: string) => Promise<boolean>;
  canAddMore: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a unique ID for a photo record */
function generatePhotoId(): string {
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/** Convert a Photo record from IndexedDB to a TripPhoto */
function photoToTripPhoto(photo: Photo): TripPhoto {
  return {
    id: photo.id,
    tripId: photo.tripId ?? '',
    blob: photo.blob,
    thumbnailBlob: photo.thumbnailBlob ?? photo.blob,
    mimeType: photo.mimeType,
    syncStatus: photo.syncStatus,
    createdAt: photo.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTripPhotos(tripId: string): UseTripPhotosResult {
  const [photos, setPhotos] = useState<TripPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Load photos from IndexedDB on mount / tripId change
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadPhotos() {
      setLoading(true);
      setError(null);

      try {
        const allPhotos = await getAllRecords('photos');
        const tripPhotos = allPhotos
          .filter((p) => p.tripId === tripId)
          .map(photoToTripPhoto);

        if (!cancelled) {
          setPhotos(tripPhotos);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setPhotos([]);
          setLoading(false);
          setError('Failed to load photos');
        }
      }
    }

    if (tripId) {
      loadPhotos();
    } else {
      setPhotos([]);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  // -------------------------------------------------------------------------
  // Sync pending photos when online
  // -------------------------------------------------------------------------

  const syncPendingPhotos = useCallback(async () => {
    try {
      const allPhotos = await getAllRecords('photos');
      const pendingPhotos = allPhotos
        .filter((p) => p.tripId === tripId && p.syncStatus === 'pending')
        .map(photoToTripPhoto);

      for (const photo of pendingPhotos) {
        await syncPhotoToPocketBase(photo);
      }

      // Reload photos to reflect updated sync status
      const updatedPhotos = await getAllRecords('photos');
      const tripPhotos = updatedPhotos
        .filter((p) => p.tripId === tripId)
        .map(photoToTripPhoto);

      setPhotos(tripPhotos);
    } catch {
      // Sync failures are handled by the service (retry logic)
    }
  }, [tripId]);

  // -------------------------------------------------------------------------
  // Listen for online events to trigger sync
  // -------------------------------------------------------------------------

  useEffect(() => {
    function handleOnline() {
      // Trigger sync within 30 seconds of reconnection
      // Use a small random delay to avoid thundering herd
      const delayMs = Math.min(Math.random() * 5000, 30000);

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(() => {
        syncPendingPhotos();
      }, delayMs);
    }

    window.addEventListener('online', handleOnline);

    // If already online on mount, sync any pending photos
    if (navigator.onLine && tripId) {
      syncPendingPhotos();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [syncPendingPhotos, tripId]);

  // -------------------------------------------------------------------------
  // Add photos
  // -------------------------------------------------------------------------

  const addPhotos = useCallback(
    async (files: File[]) => {
      setError(null);

      // Enforce 10-photo limit
      const currentCount = photos.length;
      const availableSlots = MAX_PHOTOS_PER_TRIP - currentCount;

      if (availableSlots <= 0) {
        setError('Maximum 10 photos per trip');
        return;
      }

      // Only process files up to available slots
      const filesToProcess = files.slice(0, availableSlots);

      if (filesToProcess.length < files.length) {
        setError('Maximum 10 photos per trip');
      }

      // Validate file formats
      const validFiles = filesToProcess.filter((file) => {
        if (!isAcceptedPhotoFormat(file)) {
          setError('Unsupported photo format. Accepted formats: JPEG, PNG, HEIC');
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      const newPhotos: TripPhoto[] = [];

      for (const file of validFiles) {
        try {
          // Compress the photo
          const compressed = await compressPhoto(file);

          const photoId = generatePhotoId();
          const now = new Date().toISOString();

          const syncStatus: SyncStatus = navigator.onLine ? 'pending' : 'pending';

          // Store in IndexedDB
          const photoRecord: Photo = {
            id: photoId,
            tripId,
            blob: compressed.blob,
            thumbnailBlob: compressed.thumbnailBlob,
            mimeType: compressed.mimeType,
            createdAt: now,
            syncStatus,
          };

          await putRecord('photos', photoRecord);

          const tripPhoto: TripPhoto = {
            id: photoId,
            tripId,
            blob: compressed.blob,
            thumbnailBlob: compressed.thumbnailBlob,
            mimeType: compressed.mimeType,
            syncStatus,
            createdAt: now,
          };

          newPhotos.push(tripPhoto);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to process photo';
          setError(message);
        }
      }

      if (newPhotos.length > 0) {
        setPhotos((prev) => [...prev, ...newPhotos]);

        // If online, trigger sync for newly added photos
        if (navigator.onLine) {
          // Small delay to allow state to settle
          setTimeout(() => {
            syncPendingPhotos();
          }, 100);
        }
      }
    },
    [photos.length, tripId, syncPendingPhotos],
  );

  // -------------------------------------------------------------------------
  // Remove photo
  // -------------------------------------------------------------------------

  const removePhoto = useCallback(
    async (photoId: string): Promise<boolean> => {
      // Show confirmation dialog
      const confirmed = window.confirm(
        'Are you sure you want to remove this photo? This action cannot be undone.',
      );

      if (!confirmed) {
        return false;
      }

      try {
        await deleteRecord('photos', photoId);
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        return true;
      } catch {
        setError('Failed to remove photo');
        return false;
      }
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Computed values
  // -------------------------------------------------------------------------

  const canAddMore = photos.length < MAX_PHOTOS_PER_TRIP;

  return {
    photos,
    loading,
    addPhotos,
    removePhoto,
    canAddMore,
    error,
  };
}
