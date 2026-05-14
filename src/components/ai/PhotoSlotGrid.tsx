'use client';

/**
 * ForageWise — AI Identification Photo Slot Grid
 *
 * Renders 5 photo upload slots for the selected identification category.
 * Each slot shows a category-specific placeholder image with descriptive alt
 * text. When a photo is uploaded, the placeholder is replaced with the image.
 * All upload slots meet the 44×44px minimum tap target requirement.
 */

import { useCallback, useRef } from 'react';
import type { PhotoSlotConfig, AIIdentificationCategory } from './slotConfigs';
import { getSlotsForCategory } from './slotConfigs';

/** Represents an uploaded photo for a specific slot */
export interface SlotPhoto {
  slotKey: string;
  file: File;
  objectUrl: string;
}

interface PhotoSlotGridProps {
  /** The active identification category */
  category: AIIdentificationCategory;
  /** Map of slot key to uploaded photo */
  photos: Record<string, SlotPhoto>;
  /** Callback when a photo is uploaded to a slot */
  onPhotoUpload: (slotKey: string, file: File) => void;
  /** Callback when a photo is removed from a slot */
  onPhotoRemove: (slotKey: string) => void;
}

function PhotoSlot({
  config,
  photo,
  onUpload,
  onRemove,
}: {
  config: PhotoSlotConfig;
  photo: SlotPhoto | undefined;
  onUpload: (slotKey: string, file: File) => void;
  onRemove: (slotKey: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(config.key, file);
      }
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [config.key, onUpload],
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove(config.key);
    },
    [config.key, onRemove],
  );

  return (
    <div className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white/80 dark:bg-brand-charcoal/60 overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label={`Upload photo for ${config.label}`}
        onChange={handleFileChange}
      />

      {photo ? (
        /* Uploaded photo view */
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.objectUrl}
            alt={`Uploaded photo for ${config.label}`}
            className="w-full h-32 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            aria-label={`Remove ${config.label} photo`}
            className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="px-3 py-2 bg-brand-teal/10">
            <p className="text-xs font-medium text-brand-teal">
              ✓ {config.label}
            </p>
          </div>
        </div>
      ) : (
        /* Placeholder view with upload button */
        <button
          type="button"
          onClick={handleClick}
          aria-label={`Upload photo: ${config.label} - ${config.description}`}
          className="w-full p-3 flex flex-col items-center gap-2 min-h-[44px] min-w-[44px] cursor-pointer hover:bg-brand-teal/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          {/* Placeholder image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.placeholderSrc}
            alt={config.placeholderAlt}
            className="w-16 h-16 object-contain opacity-60"
            onError={(e) => {
              // If placeholder SVG doesn't exist, show a fallback icon
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.fallback-icon')) {
                const fallback = document.createElement('div');
                fallback.className = 'fallback-icon w-16 h-16 flex items-center justify-center rounded-lg bg-brand-charcoal/5 dark:bg-brand-sand/5';
                fallback.innerHTML = '<svg class="w-8 h-8 text-brand-charcoal/30 dark:text-brand-sand/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>';
                parent.insertBefore(fallback, target);
              }
            }}
          />

          {/* Label and description */}
          <div className="text-center">
            <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand">
              {config.label}
              {config.required && (
                <span className="ml-1 text-[10px] font-semibold text-red-500 dark:text-red-400">*</span>
              )}
            </p>
            <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50">
              {config.description}
            </p>
            <p className={`text-[10px] mt-0.5 font-medium ${config.required ? 'text-red-500 dark:text-red-400' : 'text-brand-charcoal/40 dark:text-brand-sand/40'}`}>
              {config.required ? 'Required' : 'Optional'}
            </p>
          </div>

          {/* Upload indicator */}
          <div className="flex items-center gap-1 text-xs text-brand-teal font-medium">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Tap to upload
          </div>
        </button>
      )}
    </div>
  );
}

export default function PhotoSlotGrid({
  category,
  photos,
  onPhotoUpload,
  onPhotoRemove,
}: PhotoSlotGridProps) {
  const slots = getSlotsForCategory(category);

  return (
    <div>
      <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mb-3">
        Only the first photo is required. Additional photos improve accuracy.
      </p>
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        role="list"
        aria-label={`Photo upload slots for ${category} identification`}
      >
        {slots.map((slot) => (
          <div key={slot.key} role="listitem">
            <PhotoSlot
              config={slot}
              photo={photos[slot.key]}
              onUpload={onPhotoUpload}
              onRemove={onPhotoRemove}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
