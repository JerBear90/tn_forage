"use client";

import { useChallenges } from "@/hooks/useChallenges";
import ChallengesCard from "@/components/ChallengesCard";
import BadgeCelebration from "@/components/BadgeCelebration";

/**
 * ForageWise — ChallengesSection Component
 *
 * Displays a list of challenges using ChallengesCard.
 * Accepts an optional `preview` prop:
 * - When true, shows at most 3 non-completed challenges (for home page)
 * - When false/undefined, shows all challenges
 *
 * Shows a BadgeCelebration overlay when a badge is newly earned.
 * Displays a small badge preview below the heading showing earned count.
 *
 * Uses the useChallenges hook to load data from IndexedDB.
 *
 * Requirements: 2.1, 11.3
 */

interface ChallengesSectionProps {
  /** When true, limits display to 3 non-completed challenges */
  preview?: boolean;
}

export default function ChallengesSection({
  preview = false,
}: ChallengesSectionProps) {
  const {
    challenges,
    loading,
    error,
    updateCriterion,
    getChallengesPreview,
    badges,
    earnedBadges,
    justEarnedBadge,
    dismissBadgeCelebration,
  } = useChallenges();

  const displayedChallenges = preview ? getChallengesPreview() : challenges;

  if (loading) {
    return (
      <section aria-label="Challenges" className="space-y-3">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          {preview ? "Active Challenges" : "Challenges"}
        </h2>
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-lg bg-brand-charcoal/5 dark:bg-brand-sand/5 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="Challenges" className="space-y-3">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          {preview ? "Active Challenges" : "Challenges"}
        </h2>
        <div
          role="alert"
          className="rounded-lg border border-brand-earth/20 bg-brand-earth/10 p-4 text-center"
        >
          <p className="text-sm text-brand-earth dark:text-brand-earth-200">
            Unable to load challenges. Please try again later.
          </p>
        </div>
      </section>
    );
  }

  if (displayedChallenges.length === 0) {
    return (
      <section aria-label="Challenges" className="space-y-3">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          {preview ? "Active Challenges" : "Challenges"}
        </h2>
        <div className="rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/60 dark:bg-dark-surface/60 p-6 text-center">
          <p className="text-sm text-brand-charcoal/60 dark:text-dark-text-muted">
            {preview
              ? "All challenges completed — nice work!"
              : "No challenges available yet."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Challenges" className="space-y-3">
      {/* Badge celebration overlay */}
      {justEarnedBadge && (
        <BadgeCelebration
          badge={justEarnedBadge}
          onDismiss={dismissBadgeCelebration}
        />
      )}

      {/* Heading with badge count */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          {preview ? "Active Challenges" : "Challenges"}
        </h2>
        {badges.length > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-brand-teal/10 dark:bg-brand-teal/20 px-2.5 py-1 text-xs font-medium text-brand-teal dark:text-brand-teal-200"
            aria-label={`${earnedBadges.length} of ${badges.length} badges earned`}
          >
            <span aria-hidden="true">🏅</span>
            {earnedBadges.length}/{badges.length}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {displayedChallenges.map((challenge) => (
          <ChallengesCard
            key={challenge.id}
            challenge={challenge}
            onCriterionChange={updateCriterion}
          />
        ))}
      </div>
    </section>
  );
}
