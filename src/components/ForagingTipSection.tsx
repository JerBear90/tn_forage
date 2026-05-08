'use client';

/**
 * ForageWise — ForagingTipSection Component
 *
 * Displays season-specific foraging guidance on the species detail page.
 * If the species is in season for the current month, shows the relevant
 * foraging tip. If not in season, shows a notice with the seasons when
 * the species is typically found.
 *
 * All text is safety-compliant — no banned phrases.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { getCurrentSeason, isInSeasonForMonth, getCurrentMonth } from '@/utils/seasonHelpers';
import { speciesForagingTips } from '@/data/foragingTips';

export interface ForagingTipSectionProps {
  /** Species ID for looking up tips */
  speciesId: string;
  /** Species season array */
  seasons: string[];
  /** Species common name (for display) */
  commonName: string;
}

export default function ForagingTipSection({
  speciesId,
  seasons,
  commonName,
}: ForagingTipSectionProps) {
  const currentMonth = getCurrentMonth();
  const currentSeason = getCurrentSeason();
  const inSeason = isInSeasonForMonth(seasons, currentMonth);

  if (inSeason) {
    // Look up the tip for the current season and species
    const tipEntry = speciesForagingTips.find(
      (t) => t.speciesId === speciesId && t.season === currentSeason,
    );

    return (
      <div className="rounded-lg border border-brand-moss/20 bg-brand-moss/5 dark:bg-brand-moss/10 p-4">
        <h3 className="text-sm font-semibold text-brand-moss mb-2">
          🌿 Foraging Tip — {currentSeason}
        </h3>
        {tipEntry ? (
          <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 leading-relaxed">{tipEntry.tip}</p>
        ) : (
          <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 leading-relaxed">
            {commonName} is currently in season. Check local hardwood forests and
            familiar habitats for this species. Always verify your identification
            with a qualified expert before consuming.
          </p>
        )}
      </div>
    );
  }

  // Not in season — show notice with seasons when typically found
  return (
    <div className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 bg-brand-charcoal/5 dark:bg-brand-sand/5 p-4">
      <h3 className="text-sm font-semibold text-brand-charcoal/60 dark:text-brand-sand/60 mb-2">
        Not currently in season
      </h3>
      {seasons.length > 0 ? (
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 leading-relaxed">
          {commonName} is typically found during{' '}
          <span className="font-medium text-brand-charcoal dark:text-brand-sand">
            {seasons.join(', ')}
          </span>
          . Check back when conditions are right for this species.
        </p>
      ) : (
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 leading-relaxed">
          No season data is available for {commonName}.
        </p>
      )}
    </div>
  );
}
