'use client';

/**
 * WizardExampleHint — Shows a visual example for the currently selected
 * wizard option to help users identify features.
 *
 * Displays a larger image with description text. Tap the image to open
 * a full-screen lightbox with the example text overlay.
 */

import { useState, useCallback } from 'react';
import type { WizardExample } from '@/data/wizardExamples';

interface WizardExampleHintProps {
  /** Map of option labels to their examples */
  examples: Record<string, WizardExample>;
  /** Currently selected option (shows its example) */
  selectedOption: string | null;
}

export default function WizardExampleHint({
  examples,
  selectedOption,
}: WizardExampleHintProps) {
  const [imageError, setImageError] = useState(false);
  const [enlarged, setEnlarged] = useState(false);

  const example = selectedOption ? examples[selectedOption] : null;

  const openEnlarged = useCallback(() => setEnlarged(true), []);
  const closeEnlarged = useCallback(() => setEnlarged(false), []);

  if (!example) return null;

  return (
    <>
      <div className="mt-4 rounded-xl bg-brand-teal/5 dark:bg-brand-teal/10 border border-brand-teal/15 p-4 animate-in fade-in duration-200">
        {/* Larger example image */}
        {example.image && !imageError && (
          <button
            type="button"
            onClick={openEnlarged}
            className="w-full mb-3 rounded-lg overflow-hidden bg-brand-sand/40 dark:bg-brand-charcoal/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.98] transition-transform"
            aria-label={`Enlarge example image of ${selectedOption}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={example.image}
              alt={`Example of ${selectedOption}`}
              className="w-full h-40 object-cover rounded-lg"
              loading="lazy"
              onError={() => setImageError(true)}
            />
            <span className="block text-[10px] text-brand-charcoal/50 dark:text-brand-sand/50 mt-1.5 text-center">
              Tap to enlarge
            </span>
          </button>
        )}

        {/* Description text */}
        <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 leading-relaxed">
          <span className="font-semibold text-brand-teal">{selectedOption}:</span>{' '}
          {example.description}
        </p>
      </div>

      {/* Enlarged lightbox */}
      {enlarged && example.image && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Enlarged example of ${selectedOption}`}
          onClick={closeEnlarged}
          onKeyDown={(e) => e.key === 'Escape' && closeEnlarged()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeEnlarged}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Close enlarged view"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Large image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={example.image}
            alt={`Example of ${selectedOption}`}
            className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Text overlay below image */}
          <div
            className="mt-4 max-w-sm text-center px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-semibold text-white mb-2">
              {selectedOption}
            </p>
            <p className="text-sm text-white/80 leading-relaxed">
              {example.description}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
