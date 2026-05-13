/**
 * ForageWise — Trip Photo Service
 *
 * Handles photo compression, thumbnail generation, and PocketBase sync
 * for trip photo attachments. Uses the Canvas API for image processing
 * and supports JPEG, PNG, and HEIC input formats.
 */

'use client';

import { pb } from '@/auth/authService';
import { putRecord } from '@/offline/db';
import type { Photo, SyncStatus } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompressedPhoto {
  blob: Blob;
  thumbnailBlob: Blob;
  mimeType: 'image/jpeg';
}

export interface TripPhoto {
  id: string;
  tripId: string;
  blob: Blob;
  thumbnailBlob: Blob;
  mimeType: string;
  syncStatus: SyncStatus;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_DIMENSION = 1600;
const THUMBNAIL_SIZE = 64;
const JPEG_QUALITY = 0.7;
const MAX_RETRY_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1000;

/** Accepted MIME types for trip photo uploads */
export const ACCEPTED_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
] as const;

// ---------------------------------------------------------------------------
// Photo Compression
// ---------------------------------------------------------------------------

/**
 * Validate that a file is an accepted photo format (JPEG, PNG, HEIC).
 */
export function isAcceptedPhotoFormat(file: File): boolean {
  const type = file.type.toLowerCase();
  // HEIC files may not always have a MIME type set by the browser
  if (!type && /\.heic$/i.test(file.name)) return true;
  if (!type && /\.heif$/i.test(file.name)) return true;
  return ACCEPTED_PHOTO_TYPES.includes(type as (typeof ACCEPTED_PHOTO_TYPES)[number]);
}

/**
 * Load an image file into an HTMLImageElement.
 * Handles JPEG, PNG natively. HEIC is converted via canvas if the browser
 * supports it, otherwise throws an error.
 */
async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));

    const url = URL.createObjectURL(file);
    img.src = url;

    // Clean up object URL after load
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
  });
}

/**
 * Calculate scaled dimensions maintaining aspect ratio,
 * ensuring neither width nor height exceeds maxDimension.
 */
export function calculateScaledDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const ratio = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Draw an image onto a canvas at the specified dimensions and export as JPEG blob.
 */
async function canvasToJpegBlob(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob returned null'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Compress an image file to JPEG at 70% quality, max 1600px dimension.
 * Returns both full-size compressed and 64x64 thumbnail.
 *
 * Accepted formats: JPEG, PNG, HEIC.
 */
export async function compressPhoto(file: File): Promise<CompressedPhoto> {
  if (!isAcceptedPhotoFormat(file)) {
    throw new Error(
      `Unsupported photo format. Accepted formats: JPEG, PNG, HEIC`
    );
  }

  const img = await loadImage(file);

  // Calculate scaled dimensions for the full-size compressed image
  const scaled = calculateScaledDimensions(
    img.naturalWidth,
    img.naturalHeight,
    MAX_DIMENSION
  );

  // Generate full-size compressed JPEG
  const blob = await canvasToJpegBlob(img, scaled.width, scaled.height, JPEG_QUALITY);

  // Generate 64x64 thumbnail
  const thumbnailBlob = await canvasToJpegBlob(img, THUMBNAIL_SIZE, THUMBNAIL_SIZE, JPEG_QUALITY);

  return {
    blob,
    thumbnailBlob,
    mimeType: 'image/jpeg',
  };
}

// ---------------------------------------------------------------------------
// PocketBase Sync
// ---------------------------------------------------------------------------

/**
 * Wait for a specified number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sync a locally stored photo to PocketBase file storage.
 * Retries up to 3 times with exponential backoff (1s, 2s, 4s).
 *
 * On success, updates the photo's syncStatus to 'synced' in IndexedDB.
 * On failure after all retries, marks syncStatus as 'failed'.
 */
export async function syncPhotoToPocketBase(
  photo: TripPhoto
): Promise<{ success: boolean; remoteUrl?: string }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      // Build FormData for file upload
      const formData = new FormData();
      formData.append('photo', photo.blob, `trip-photo-${photo.id}.jpg`);
      formData.append('tripId', photo.tripId);
      formData.append('mimeType', photo.mimeType);
      formData.append('createdAt', photo.createdAt);

      const record = await pb.collection('trip_photos').create(formData);

      // Get the remote URL for the uploaded file
      const remoteUrl = pb.files.getURL(record, record['photo'] as string);

      // Update local IndexedDB record to mark as synced
      const syncedPhoto: Photo = {
        id: photo.id,
        expeditionLogId: undefined,
        blob: photo.blob,
        mimeType: photo.mimeType,
        createdAt: photo.createdAt,
        syncStatus: 'synced' as SyncStatus,
      };

      try {
        await putRecord('photos', syncedPhoto);
      } catch {
        // IndexedDB update is best-effort; sync still succeeded
      }

      return { success: true, remoteUrl };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't wait after the last attempt
      if (attempt < MAX_RETRY_ATTEMPTS - 1) {
        const backoffMs = BASE_BACKOFF_MS * Math.pow(2, attempt);
        await delay(backoffMs);
      }
    }
  }

  // All retries exhausted — mark as failed in IndexedDB
  try {
    const failedPhoto: Photo = {
      id: photo.id,
      expeditionLogId: undefined,
      blob: photo.blob,
      mimeType: photo.mimeType,
      createdAt: photo.createdAt,
      syncStatus: 'failed' as SyncStatus,
    };
    await putRecord('photos', failedPhoto);
  } catch {
    // Best-effort status update
  }

  console.error(
    `[tripPhotoService] Failed to sync photo ${photo.id} after ${MAX_RETRY_ATTEMPTS} attempts:`,
    lastError?.message
  );

  return { success: false };
}
