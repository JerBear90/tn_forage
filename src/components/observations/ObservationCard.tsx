'use client';

/**
 * ForageWise — ObservationCard Component
 *
 * Displays a single observation with:
 * - Photo(s), species guess, location, date
 * - Quality grade badge (Casual / Needs ID / Research Grade)
 * - Community identifications with agree/disagree buttons
 * - AI suggestion disclaimer
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { Observation, ObservationGrade } from '@/types/observations';

const GRADE_CONFIG: Record<ObservationGrade, { label: string; color: string; icon: string }> = {
  casual: { label: 'Casual', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300', icon: '○' },
  'needs-id': { label: 'Needs ID', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: '?' },
  research: { label: 'Research Grade', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '✓' },
};

export interface ObservationCardProps {
  observation: Observation;
  onAgree?: (observationId: string, identificationId: string) => void;
  onDisagree?: (observationId: string, identificationId: string) => void;
  onSuggestId?: (observationId: string) => void;
  isAuthenticated?: boolean;
}

export default function ObservationCard({
  observation,
  onAgree,
  onDisagree,
  onSuggestId,
  isAuthenticated = false,
}: ObservationCardProps) {
  const [showAllIds, setShowAllIds] = useState(false);
  const grade = GRADE_CONFIG[observation.qualityGrade];

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return iso; }
  };

  return (
    <div className="rounded-xl border border-brand-charcoal/10 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden">
      {/* Photo */}
      {observation.photos.length > 0 && (
        <div className="relative">
          <img
            src={observation.photos[0]}
            alt={`Observation: ${observation.speciesGuess}`}
            className="w-full h-44 object-cover"
            loading="lazy"
          />
          {observation.photos.length > 1 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 text-white text-[10px] px-2 py-0.5">
              +{observation.photos.length - 1} more
            </span>
          )}
          {/* Quality grade badge */}
          <span className={`absolute top-2 left-2 rounded-full text-[10px] font-bold px-2 py-0.5 ${grade.color}`}>
            {grade.icon} {grade.label}
          </span>
        </div>
      )}

      <div className="p-3 space-y-2">
        {/* Species guess + link */}
        <div className="flex items-start justify-between gap-2">
          <div>
            {observation.matchedSpeciesId ? (
              <Link href={`/field-guide/${observation.matchedSpeciesId}`} className="text-sm font-semibold text-brand-charcoal dark:text-dark-text hover:text-brand-teal transition-colors">
                {observation.speciesGuess}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-brand-charcoal dark:text-dark-text">{observation.speciesGuess}</p>
            )}
            <p className="text-[11px] text-brand-charcoal/50 dark:text-brand-sand/50">
              by {observation.userName || 'Anonymous'} • {formatDate(observation.observedAt)}
            </p>
          </div>
        </div>

        {/* Location */}
        {(observation.placeName || observation.coordinates) && (
          <p className="text-[11px] text-brand-charcoal/60 dark:text-brand-sand/60 flex items-center gap-1">
            <span aria-hidden="true">📍</span>
            {observation.placeName || `${observation.coordinates?.lat.toFixed(3)}, ${observation.coordinates?.lng.toFixed(3)}`}
          </p>
        )}

        {/* Habitat info */}
        {(observation.substrate || observation.habitatNotes) && (
          <p className="text-[11px] text-brand-charcoal/50 dark:text-brand-sand/50 leading-relaxed">
            {observation.substrate && <span className="font-medium">{observation.substrate}</span>}
            {observation.substrate && observation.habitatNotes && ' — '}
            {observation.habitatNotes}
          </p>
        )}

        {/* Community identifications */}
        {observation.identifications.length > 0 && (
          <div className="border-t border-brand-charcoal/5 dark:border-dark-border pt-2 mt-2">
            <p className="text-[10px] font-semibold text-brand-charcoal/50 dark:text-brand-sand/50 uppercase tracking-wide mb-1">
              Community IDs ({observation.identifications.length})
            </p>
            {observation.identifications.slice(0, showAllIds ? undefined : 2).map((id) => (
              <div key={id.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-1.5">
                  {id.isAI && <span className="text-[9px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded px-1 py-0.5 font-medium">AI</span>}
                  <span className="text-xs text-brand-charcoal dark:text-dark-text">{id.speciesGuess}</span>
                  <span className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40">— {id.userName}</span>
                </div>
                {isAuthenticated && onAgree && onDisagree && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onAgree(observation.id, id.id)}
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/20"
                      aria-label={`Agree with ${id.speciesGuess}`}
                    >
                      ✓ Agree
                    </button>
                    <button
                      type="button"
                      onClick={() => onDisagree(observation.id, id.id)}
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20"
                      aria-label={`Disagree with ${id.speciesGuess}`}
                    >
                      ✗
                    </button>
                  </div>
                )}
              </div>
            ))}
            {observation.identifications.length > 2 && (
              <button
                type="button"
                onClick={() => setShowAllIds(!showAllIds)}
                className="text-[10px] text-brand-teal hover:underline mt-1"
              >
                {showAllIds ? 'Show less' : `Show all ${observation.identifications.length} IDs`}
              </button>
            )}
          </div>
        )}

        {/* Suggest ID button */}
        {isAuthenticated && onSuggestId && observation.qualityGrade !== 'research' && (
          <button
            type="button"
            onClick={() => onSuggestId(observation.id)}
            className="w-full rounded-lg border border-brand-teal/20 bg-brand-teal/5 px-3 py-2 text-xs font-medium text-brand-teal hover:bg-brand-teal/10 transition-colors mt-2"
          >
            🔍 Suggest an ID
          </button>
        )}

        {/* AI disclaimer */}
        {observation.aiSuggestions.length > 0 && (
          <p className="text-[9px] text-brand-charcoal/40 dark:text-brand-sand/40 italic">
            AI suggestions are a learning tool, not expert confirmation. Verify before consuming.
          </p>
        )}
      </div>
    </div>
  );
}
