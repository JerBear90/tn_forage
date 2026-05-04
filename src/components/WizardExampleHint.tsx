'use client';

/**
 * WizardExampleHint — Shows a visual example for the currently selected
 * or hovered wizard option to help users identify features.
 *
 * Displays a small image thumbnail and description text below the option chips.
 */

import { useState } from 'react';
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

  const example = selectedOption ? examples[selectedOption] : null;

  if (!example) return null;

  return (
    <div className="mt-3 rounded-lg bg-brand-teal/5 dark:bg-brand-teal/10 border border-brand-teal/15 p-3 flex items-start gap-3 animate-in fade-in duration-200">
      {/* Example image thumbnail */}
      {example.image && !imageError && (
        <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-brand-sand/40 dark:bg-brand-charcoal/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={example.image}
            alt={`Example of ${selectedOption}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      {/* Description text */}
      <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70 leading-relaxed pt-0.5">
        <span className="font-medium text-brand-teal">{selectedOption}:</span>{' '}
        {example.description}
      </p>
    </div>
  );
}
