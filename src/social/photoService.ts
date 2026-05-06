/**
 * ForageWise — Photo Service
 *
 * Handles photo validation, EXIF stripping, upload (with offline queueing),
 * and retrieval for social photo sharing.
 * All data is persisted to IndexedDB and queued for sync when offline.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 15.2
 */

import { getDB, putRecord } from '@/offline/db';
import type {
  SocialPhoto,
  SocialPhotoMimeType,
  SyncStatus,
} from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum photo file size in bytes (10 MB) */
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

/** Accepted MIME types for photo uploads */
export const ACCEPTED_MIME_TYPES: readonly string[] = ['image/jpeg', 'image/png'];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a photo blob's MIME type and file size.
 *
 * - Only JPEG and PNG are accepted (Requirement 3.2).
 * - Maximum file size is 10 MB.
 *
 * @param blob - The photo blob to validate
 * @returns An object with `valid: true` or `valid: false` with an error message
 */
export function validatePhoto(blob: Blob): { valid: boolean; error?: string } {
  if (!ACCEPTED_MIME_TYPES.includes(blob.type)) {
    return { valid: false, error: 'Only JPEG and PNG images are accepted.' };
  }

  if (blob.size > MAX_PHOTO_SIZE) {
    return { valid: false, error: 'Photo must be 10 MB or smaller.' };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// EXIF Stripping
// ---------------------------------------------------------------------------

/**
 * Strip EXIF metadata from an image blob by re-encoding through Canvas.
 *
 * In browser environments with OffscreenCanvas/Canvas support, the image is
 * decoded, drawn to a canvas, and re-exported — which drops all EXIF data.
 * In environments without Canvas (Node/SSR/tests), the blob is returned as-is.
 *
 * @param blob - The image blob to strip EXIF data from
 * @returns A new blob with EXIF data removed (or the original if Canvas is unavailable)
 */
export async function stripExif(blob: Blob): Promise<Blob> {
  // Check for OffscreenCanvas availability (browser environment)
  if (typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();

        // Re-export as the same MIME type (defaults to PNG if unsupported)
        const outputType = blob.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
        const quality = blob.type === 'image/jpeg' ? 0.92 : undefined;
        const strippedBlob = await canvas.convertToBlob({
          type: outputType,
          quality,
        });

        return strippedBlob;
      }

      bitmap.close();
    } catch {
      // Fall through to return original blob if Canvas processing fails
    }
  }

  // Fallback: return blob as-is (Node/SSR/test environments)
  return blob;
}

// ---------------------------------------------------------------------------
// Upload Photo
// ---------------------------------------------------------------------------

/**
 * Upload a photo to IndexedDB and enqueue for sync.
 *
 * - If `keepLocation` is false, EXIF data is stripped and location info is removed
 *   (Requirements 3.5, 15.2).
 * - The photo is saved to the `socialPhotos` store and enqueued in `syncQueue`.
 *
 * @param photo - Photo data without id, createdAt, syncStatus, or thumbnailBlob
 * @param keepLocation - Whether to preserve GPS location data
 * @returns The saved SocialPhoto record
 */
export async function uploadPhoto(
  photo: Omit<SocialPhoto, 'id' | 'createdAt' | 'syncStatus' | 'thumbnailBlob'>,
  keepLocation: boolean,
): Promise<SocialPhoto> {
  const now = new Date().toISOString();

  let processedBlob = photo.blob;
  let hasLocation = photo.hasLocation;
  let coordinates = photo.coordinates;

  // Strip EXIF and remove location if user hasn't opted in
  if (!keepLocation) {
    processedBlob = await stripExif(photo.blob);
    hasLocation = false;
    coordinates = undefined;
  }

  const savedPhoto: SocialPhoto = {
    id: crypto.randomUUID(),
    userId: photo.userId,
    targetType: photo.targetType,
    targetId: photo.targetId,
    blob: processedBlob,
    caption: photo.caption,
    hasLocation,
    coordinates,
    mimeType: photo.mimeType,
    createdAt: now,
    syncStatus: 'pending' as SyncStatus,
  };

  // Persist to IndexedDB socialPhotos store
  await putRecord('socialPhotos', savedPhoto);

  // Enqueue in sync queue for offline-first sync
  await putRecord('syncQueue', {
    localId: crypto.randomUUID(),
    serverId: undefined,
    userId: photo.userId,
    collection: 'socialPhotos',
    operation: 'create',
    payload: savedPhoto,
    payloadHash: '',
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    retryCount: 0,
    clientVersion: 1,
  });

  return savedPhoto;
}

// ---------------------------------------------------------------------------
// Get Photos
// ---------------------------------------------------------------------------

/**
 * Retrieve user photos for a target entity, sorted by createdAt descending.
 *
 * Returns photos from the IndexedDB `socialPhotos` store filtered by
 * targetType and targetId. Photos are sorted newest-first.
 *
 * Note: Seed photos (park images) are handled at the component level
 * (PhotoTour receives seedPhotos and userPhotos separately). This function
 * returns only user-submitted photos.
 *
 * @param targetType - The type of entity (park, trail, species)
 * @param targetId   - The ID of the target entity
 * @returns An array of SocialPhoto records sorted by createdAt descending
 */
export async function getPhotos(
  targetType: string,
  targetId: string,
): Promise<SocialPhoto[]> {
  const db = await getDB();

  const photos = await db.getAllFromIndex(
    'socialPhotos',
    'by-targetType-targetId',
    [targetType, targetId],
  );

  // Sort by createdAt descending (most recent first)
  photos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return photos;
}
