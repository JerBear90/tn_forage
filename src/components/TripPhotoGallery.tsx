'use client';

/**
 * ForageWise — TripPhotoGallery Component
 *
 * Displays a photo gallery for a trip with the ability to add and remove photos.
 * Shows thumbnail previews in a scrollable horizontal gallery.
 * Enforces a 10-photo limit with user-facing error messaging.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.5
 */

import { useRef } from 'react';
import { useTripPhotos } from '@/hooks/useTripPhotos';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TripPhotoGalleryProps {
  tripId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TripPhotoGallery({ tripId }: TripPhotoGalleryProps) {
  const { photos, loading, addPhotos, removePhoto, canAddMore, error } =
    useTripPhotos(tripId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleAddPhotosClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await addPhotos(Array.from(files));

    // Reset the input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="rounded-xl border border-brand-teal/15 bg-white/90 dark:bg-brand-charcoal/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span aria-hidden="true">📷</span>
          <h2 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand">
            Photos
          </h2>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="rounded-xl border border-brand-teal/15 bg-white/90 dark:bg-brand-charcoal/60 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span aria-hidden="true">📷</span>
          <h2 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand">
            Photos
          </h2>
          {photos.length > 0 && (
            <span className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50">
              ({photos.length}/10)
            </span>
          )}
        </div>

        {/* Add Photos button */}
        <button
          type="button"
          onClick={handleAddPhotosClick}
          disabled={!canAddMore}
          aria-label="Add Photos"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg bg-brand-teal/10 px-3 py-2 text-xs font-medium text-brand-teal hover:bg-brand-teal/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
          </svg>
          <span>Add Photos</span>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic"
          multiple
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {/* Photo gallery */}
      {photos.length > 0 ? (
        <div
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin"
          role="list"
          aria-label="Trip photos"
        >
          {photos.map((photo) => (
            <PhotoThumbnail
              key={photo.id}
              photo={photo}
              onRemove={removePhoto}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50">
          No photos attached. Tap &quot;Add Photos&quot; to document your trip.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PhotoThumbnail sub-component
// ---------------------------------------------------------------------------

interface PhotoThumbnailProps {
  photo: {
    id: string;
    thumbnailBlob: Blob;
    mimeType: string;
  };
  onRemove: (photoId: string) => Promise<boolean>;
}

function PhotoThumbnail({ photo, onRemove }: PhotoThumbnailProps) {
  const thumbnailUrl = URL.createObjectURL(photo.thumbnailBlob);

  return (
    <div
      role="listitem"
      className="relative flex-shrink-0 group"
    >
      <img
        src={thumbnailUrl}
        alt="Trip photo"
        className="w-16 h-16 rounded-lg object-cover border border-brand-teal/10"
        onLoad={() => URL.revokeObjectURL(thumbnailUrl)}
      />
      {/* Remove button overlay */}
      <button
        type="button"
        onClick={() => onRemove(photo.id)}
        aria-label="Remove photo"
        className="absolute -top-1.5 -right-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity"
      >
        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold shadow-sm">
          ×
        </span>
      </button>
    </div>
  );
}
