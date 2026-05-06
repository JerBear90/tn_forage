"use client";

/**
 * ForageWise — Badges Grid Component
 *
 * Displays all challenge badges in a responsive grid.
 * - Earned badges: full color with earned date
 * - Unearned badges: grayed out with lock icon overlay
 * - Shows progress summary (e.g., "3 of 10 earned")
 * - Responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop
 *
 * Requirements: 44px min touch targets, ARIA labels, dark mode support
 */

import type { ChallengeBadge } from "@/types";

interface BadgesGridProps {
  badges: ChallengeBadge[];
  earnedCount: number;
}

export default function BadgesGrid({ badges, earnedCount }: BadgesGridProps) {
  const totalCount = badges.length;

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-base text-brand-forest dark:text-brand-moss">
          Badges
        </h3>
        <span className="text-xs font-medium text-brand-charcoal/60 dark:text-dark-text-muted">
          {earnedCount} of {totalCount} earned
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 w-full rounded-full bg-brand-charcoal/10 dark:bg-dark-border overflow-hidden"
        role="progressbar"
        aria-valuenow={earnedCount}
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-label={`${earnedCount} of ${totalCount} badges earned`}
      >
        <div
          className="h-full rounded-full bg-brand-teal dark:bg-brand-teal-400 transition-all duration-300"
          style={{
            width: totalCount > 0 ? `${(earnedCount / totalCount) * 100}%` : "0%",
          }}
        />
      </div>

      {/* Badge grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        role="list"
        aria-label="Challenge badges"
      >
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge Card
// ---------------------------------------------------------------------------

function BadgeCard({ badge }: { badge: ChallengeBadge }) {
  const earnedDate = badge.earnedAt
    ? new Date(badge.earnedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      role="listitem"
      aria-label={`${badge.title}${badge.isEarned ? ", earned" : ", locked"}`}
      className={`relative flex flex-col items-center justify-center rounded-xl border p-4 min-h-[120px] transition-all ${
        badge.isEarned
          ? "border-brand-teal/20 bg-white dark:bg-dark-surface/80 shadow-sm"
          : "border-brand-charcoal/10 dark:border-dark-border bg-brand-charcoal/5 dark:bg-dark-surface/40"
      }`}
    >
      {/* Lock overlay for unearned badges */}
      {!badge.isEarned && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-brand-charcoal/5 dark:bg-black/10">
          <span
            className="absolute top-2 right-2 text-brand-charcoal/30 dark:text-dark-text-muted/40"
            aria-hidden="true"
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
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </span>
        </div>
      )}

      {/* Badge icon */}
      <span
        className={`text-3xl leading-none mb-2 ${
          badge.isEarned ? "" : "grayscale opacity-40"
        }`}
        role="img"
        aria-hidden="true"
      >
        {badge.icon}
      </span>

      {/* Badge title */}
      <p
        className={`text-xs font-medium text-center leading-tight ${
          badge.isEarned
            ? "text-brand-charcoal dark:text-dark-text"
            : "text-brand-charcoal/40 dark:text-dark-text-muted/60"
        }`}
      >
        {badge.title}
      </p>

      {/* Earned date */}
      {earnedDate && (
        <p className="text-[10px] text-brand-charcoal/50 dark:text-dark-text-muted mt-1">
          {earnedDate}
        </p>
      )}
    </div>
  );
}
