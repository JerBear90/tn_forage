'use client';

/**
 * PhotoTour — Horizontally swipeable photo gallery with lightbox.
 *
 * Displays seed photos first, then user-submitted photos sorted by most recent.
 * Tap to open full-screen lightbox using the existing ImageLightbox component.
 * Uses CSS scroll-snap for touch-friendly horizontal scrolling.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { useState, useMemo, useCallback } from 'react';
import type { SocialPhoto } from '@/types';
import ImageLightbox from '@/components/ImageLightbox';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PhotoTourProps {
  seedPhotos: string[];
  userPhotos: SocialPhoto[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PhotoTour({ seedPhotos, userPhotos }: PhotoTourProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState('Photo');

  // Sort user photos by most recent first
  const sortedUserPhotos = useMemo(() => {
    return [...userPhotos].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [userPhotos]);

  // Create object URLs for user photo blobs
  const userPhotoUrls = useMemo(() => {
    return sortedUserPhotos.map((photo) => {
      try {
        return URL.createObjectURL(photo.blob);
      } catch {
        return null;
      }
    });
  }, [sortedUserPhotos]);

  const totalPhotos = seedPhotos.length + sortedUserPhotos.length;

  const openLightbox = useCallback((src: string, alt: string) => {
    setLightboxSrc(src);
    setLightboxAlt(alt);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setLightboxSrc(null);
  }, []);

  if (totalPhotos === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
        Photos
      </h2>

      {/* Horizontally scrollable gallery with snap scrolling */}
      <div
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 scrollbar-thin"
        role="region"
        aria-label="Photo gallery"
      >
        {/* Seed photos first */}
        {seedPhotos.map((src, idx) => (
          <button
            key={`seed-${idx}`}
            type="button"
            onClick={() => openLightbox(src, `Park photo ${idx + 1}`)}
            className="shrink-0 snap-start rounded-lg overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-transform active:scale-[0.97] min-w-[200px] min-h-[44px]"
            aria-label={`View park photo ${idx + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Park photo ${idx + 1}`}
              className="w-[200px] h-[140px] object-cover rounded-lg bg-brand-sand/40 dark:bg-brand-charcoal/40"
              loading="lazy"
            />
          </button>
        ))}

        {/* User-submitted photos (sorted by most recent) */}
        {sortedUserPhotos.map((photo, idx) => {
          const url = userPhotoUrls[idx];
          if (!url) return null;

          return (
            <button
              key={`user-${photo.id}`}
              type="button"
              onClick={() => openLightbox(url, photo.caption || `User photo ${idx + 1}`)}
              className="shrink-0 snap-start rounded-lg overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-transform active:scale-[0.97] min-w-[200px] min-h-[44px]"
              aria-label={photo.caption || `View user photo ${idx + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={photo.caption || `User photo ${idx + 1}`}
                className="w-[200px] h-[140px] object-cover rounded-lg bg-brand-sand/40 dark:bg-brand-charcoal/40"
                loading="lazy"
              />
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        imageSrc={lightboxSrc}
        imageAlt={lightboxAlt}
      />
    </section>
  );
}
