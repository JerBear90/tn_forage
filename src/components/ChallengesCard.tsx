"use client";

import Link from "next/link";
import type { Challenge, ChallengeCategory } from "@/types";

/**
 * ForageFlow — ChallengesCard Component
 *
 * Renders a single challenge with:
 * - Title, description, and category badge
 * - Progress bar (completed criteria / total criteria)
 * - Criterion checklist with checkboxes
 * - Completion badge when all criteria are met
 * - Full card interactivity: entire card is a clickable Link to /community#challenges
 *
 * Interactive checkboxes have 44x44px minimum tap targets per ADA requirements.
 * The card itself is a Next.js Link with hover/focus feedback.
 *
 * Requirements: 2.3, 2.4, 13.1, 13.2, 13.3, 13.4, 13.5
 */

interface ChallengesCardProps {
  challenge: Challenge;
  onCriterionChange: (
    challengeId: string,
    criterionId: string,
    completed: boolean,
  ) => void;
}

/** Category badge colors keyed by challenge category. */
const categoryStyles: Record<
  ChallengeCategory,
  { bg: string; text: string; label: string }
> = {
  foraging: {
    bg: "bg-brand-moss-100 dark:bg-brand-moss-800",
    text: "text-brand-moss-700 dark:text-brand-moss-200",
    label: "Foraging",
  },
  seasonal: {
    bg: "bg-brand-earth-100 dark:bg-brand-earth-800",
    text: "text-brand-earth-700 dark:text-brand-earth-200",
    label: "Seasonal",
  },
  "park-exploration": {
    bg: "bg-brand-teal-100 dark:bg-brand-teal-800",
    text: "text-brand-teal-700 dark:text-brand-teal-200",
    label: "Park Exploration",
  },
};

export default function ChallengesCard({
  challenge,
  onCriterionChange,
}: ChallengesCardProps) {
  const completedCount = challenge.criteria.filter((c) => c.completed).length;
  const totalCount = challenge.criteria.length;
  const isCompleted = !!challenge.completedAt;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const style = categoryStyles[challenge.category] ?? categoryStyles.foraging;

  return (
    <Link
      href="/community#challenges"
      aria-label={`View challenge: ${challenge.title}`}
      className="block min-h-[44px] rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white dark:bg-dark-surface/80 p-4 shadow-sm transition-colors duration-200 hover:border-brand-teal hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2 dark:focus:ring-offset-dark-surface"
    >
      <article>
        {/* Header: title + category badge + completion badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-brand-charcoal dark:text-dark-text leading-snug">
                {challenge.title}
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium leading-tight ${style.bg} ${style.text}`}
              >
                {style.label}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-brand-charcoal/70 dark:text-dark-text-muted">
              {challenge.description}
            </p>
          </div>

          {/* Completion badge */}
          {isCompleted && (
            <span
              className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-brand-teal-100 dark:bg-brand-teal-800"
              aria-label="Challenge completed"
              role="img"
            >
              <svg
                aria-hidden="true"
                className="w-5 h-5 text-brand-teal dark:text-brand-teal-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-brand-charcoal/60 dark:text-dark-text-muted">
              Progress
            </span>
            <span className="text-xs font-medium text-brand-charcoal/60 dark:text-dark-text-muted">
              {completedCount} / {totalCount}
            </span>
          </div>
          <div
            className="h-2 w-full rounded-full bg-brand-charcoal/10 dark:bg-dark-border overflow-hidden"
            role="progressbar"
            aria-valuenow={completedCount}
            aria-valuemin={0}
            aria-valuemax={totalCount}
            aria-label={`${completedCount} of ${totalCount} criteria completed`}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted
                  ? "bg-brand-teal dark:bg-brand-teal-400"
                  : "bg-brand-moss dark:bg-brand-moss-400"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Criteria checklist */}
        <ul className="mt-3 space-y-1" aria-label="Challenge criteria">
          {challenge.criteria.map((criterion) => (
            <li key={criterion.id} className="flex items-start">
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
              <label
                className="flex items-start gap-2 w-full cursor-pointer group min-h-[44px] py-1.5"
                htmlFor={`criterion-${criterion.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Checkbox with 44x44px tap target */}
                <span className="flex items-center justify-center w-[44px] h-[44px] -m-2 flex-shrink-0">
                  <input
                    id={`criterion-${criterion.id}`}
                    type="checkbox"
                    checked={criterion.completed}
                    onChange={(e) =>
                      onCriterionChange(
                        challenge.id,
                        criterion.id,
                        e.target.checked,
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-brand-charcoal/30 dark:border-dark-border text-brand-teal focus:ring-brand-teal focus:ring-offset-0 dark:bg-dark-surface cursor-pointer"
                    aria-label={`${criterion.label}${criterion.completed ? " (completed)" : ""}`}
                  />
                </span>
                <span
                  className={`text-xs leading-relaxed pt-0.5 transition-colors ${
                    criterion.completed
                      ? "text-brand-charcoal/40 dark:text-dark-text-muted/60 line-through"
                      : "text-brand-charcoal/80 dark:text-dark-text group-hover:text-brand-charcoal dark:group-hover:text-dark-text"
                  }`}
                >
                  {criterion.label}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </article>
    </Link>
  );
}
