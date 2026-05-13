"use client";

/**
 * ForageWise — Badges Grid Component
 *
 * Displays all challenge badges in a responsive grid.
 * - Earned badges: full color with earned date
 * - Unearned badges: grayed out with lock icon overlay
 * - Tap any badge to see what's needed to achieve it
 * - Shows progress summary (e.g., "3 of 10 earned")
 * - Responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop
 *
 * Requirements: 44px min touch targets, ARIA labels, dark mode support
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllRecords } from "@/offline/db";
import type { ChallengeBadge, Challenge } from "@/types";

interface BadgesGridProps {
  badges: ChallengeBadge[];
  earnedCount: number;
}

export default function BadgesGrid({ badges, earnedCount }: BadgesGridProps) {
  const totalCount = badges.length;
  const [selectedBadge, setSelectedBadge] = useState<ChallengeBadge | null>(null);

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
          <BadgeCard key={badge.id} badge={badge} onTap={() => setSelectedBadge(badge)} />
        ))}
      </div>

      {/* Badge detail modal */}
      {selectedBadge && (
        <BadgeDetailModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge Detail Modal
// ---------------------------------------------------------------------------

function BadgeDetailModal({ badge, onClose }: { badge: ChallengeBadge; onClose: () => void }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(true);

  const earnedDate = badge.earnedAt
    ? new Date(badge.earnedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Load the related challenge from IndexedDB
  useEffect(() => {
    let cancelled = false;

    async function loadChallenge() {
      try {
        const challenges = await getAllRecords("challenges");
        const found = challenges.find((c) => c.id === badge.challengeId);
        if (!cancelled) {
          setChallenge(found ?? null);
        }
      } catch {
        // Graceful fallback — just don't show criteria
      } finally {
        if (!cancelled) setLoadingChallenge(false);
      }
    }

    loadChallenge();
    return () => { cancelled = true; };
  }, [badge.challengeId]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Badge: ${badge.title}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-dark-surface border border-brand-teal/20 shadow-xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Close button */}
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close badge details"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-brand-charcoal/50 dark:text-brand-sand/50 hover:bg-brand-charcoal/10 dark:hover:bg-brand-sand/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Badge icon */}
        <div className="flex flex-col items-center text-center">
          <span
            className={`text-5xl leading-none mb-3 ${badge.isEarned ? "" : "grayscale opacity-50"}`}
            role="img"
            aria-hidden="true"
          >
            {badge.icon}
          </span>

          {/* Title */}
          <h3 className="font-heading font-semibold text-lg text-brand-charcoal dark:text-brand-sand mb-2">
            {badge.title}
          </h3>

          {/* Description — what's needed to achieve it */}
          <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 leading-relaxed mb-3">
            {badge.description}
          </p>

          {/* Status */}
          {badge.isEarned ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 px-3 py-1.5">
              <svg className="w-4 h-4 text-brand-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-brand-teal">
                Earned {earnedDate}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-charcoal/5 dark:bg-brand-sand/5 border border-brand-charcoal/10 dark:border-brand-sand/10 px-3 py-1.5">
              <svg className="w-4 h-4 text-brand-charcoal/40 dark:text-brand-sand/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="text-xs font-medium text-brand-charcoal/50 dark:text-brand-sand/50">
                Not yet earned
              </span>
            </div>
          )}
        </div>

        {/* Challenge criteria checklist */}
        {loadingChallenge ? (
          <div className="mt-4 space-y-2 animate-pulse">
            <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-1/3" />
            <div className="h-3 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-full" />
            <div className="h-3 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-full" />
          </div>
        ) : challenge && challenge.criteria.length > 0 ? (
          <div className="mt-5 border-t border-brand-charcoal/10 dark:border-dark-border pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-charcoal/50 dark:text-brand-sand/50 mb-3">
              Challenges ({challenge.criteria.filter((c) => c.completed).length}/{challenge.criteria.length})
            </h4>
            <ul className="space-y-2">
              {challenge.criteria.map((criterion) => (
                <li
                  key={criterion.id}
                  className="flex items-start gap-2.5"
                >
                  {criterion.completed ? (
                    <svg className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-brand-charcoal/20 dark:border-brand-sand/20 shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-sm leading-tight ${
                      criterion.completed
                        ? "text-brand-charcoal/70 dark:text-brand-sand/70 line-through"
                        : "text-brand-charcoal dark:text-brand-sand"
                    }`}
                  >
                    {criterion.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Go to challenge button */}
        <Link
          href={`/community?challenge=${badge.challengeId}#challenges`}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-teal/10 border border-brand-teal/20 px-4 py-3 min-h-[44px] text-sm font-medium text-brand-teal hover:bg-brand-teal/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          onClick={onClose}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Go to this challenge
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge Card
// ---------------------------------------------------------------------------

function BadgeCard({ badge, onTap }: { badge: ChallengeBadge; onTap: () => void }) {
  const earnedDate = badge.earnedAt
    ? new Date(badge.earnedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <button
      type="button"
      onClick={onTap}
      role="listitem"
      aria-label={`${badge.title}${badge.isEarned ? ", earned" : ", locked"}. Tap for details.`}
      className={`relative flex flex-col items-center justify-center rounded-xl border p-4 min-h-[120px] min-w-[44px] transition-all cursor-pointer ${
        badge.isEarned
          ? "border-brand-teal/20 bg-white dark:bg-dark-surface/80 shadow-sm hover:shadow-md hover:border-brand-teal/40"
          : "border-brand-charcoal/10 dark:border-dark-border bg-brand-charcoal/5 dark:bg-dark-surface/40 hover:bg-brand-charcoal/10 dark:hover:bg-dark-surface/60"
      } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal`}
    >
      {/* Lock overlay for unearned badges */}
      {!badge.isEarned && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-brand-charcoal/5 dark:bg-black/10 pointer-events-none">
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
    </button>
  );
}
