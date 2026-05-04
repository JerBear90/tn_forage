'use client';

/**
 * ReviewsSection — Displays aggregate rating, paginated review list,
 * and a "Write a Review" form for authenticated users.
 *
 * Shows cached reviews when offline with an offline indicator banner.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 4.1, 4.6
 */

import { useState, useEffect, useCallback } from 'react';
import type { ReviewTargetType, ReviewLocal, ReviewAggregationLocal } from '@/types';
import { getReviews, getAggregation, submitReview, validateReviewText } from '@/social/reviewService';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAuth } from '@/auth/useAuth';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ReviewsSectionProps {
  targetType: ReviewTargetType;
  targetId: string;
  isAuthenticated: boolean;
}

// ---------------------------------------------------------------------------
// Star Rating Display (read-only)
// ---------------------------------------------------------------------------

function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const halfFilled = !filled && rating >= star - 0.5;

        return (
          <svg
            key={star}
            aria-hidden="true"
            className={`w-4 h-4 ${
              filled
                ? 'text-amber-400'
                : halfFilled
                  ? 'text-amber-300'
                  : 'text-brand-charcoal/20 dark:text-dark-text-muted/30'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Star Rating Selector (interactive)
// ---------------------------------------------------------------------------

function StarRatingSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = hovered > 0 ? hovered >= star : value >= star;

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
          >
            <svg
              aria-hidden="true"
              className={`w-7 h-7 transition-colors ${
                active ? 'text-amber-400' : 'text-brand-charcoal/20 dark:text-dark-text-muted/30'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

export default function ReviewsSection({
  targetType,
  targetId,
  isAuthenticated,
}: ReviewsSectionProps) {
  const isOnline = useOnlineStatus();
  const { user } = useAuth();
  const currentUserId = user?.id ?? 'guest';
  const displayName = user?.displayName ?? 'Anonymous';

  // Aggregation state
  const [aggregation, setAggregation] = useState<ReviewAggregationLocal | null>(null);

  // Reviews list state
  const [reviews, setReviews] = useState<ReviewLocal[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Review form state
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formText, setFormText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load aggregation and first page of reviews on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [agg, firstPage] = await Promise.all([
          getAggregation(targetType, targetId),
          getReviews(targetType, targetId, 1, PAGE_SIZE),
        ]);

        if (cancelled) return;

        setAggregation(agg);
        setReviews(firstPage);
        setHasMore(firstPage.length === PAGE_SIZE);
        setLoadingReviews(false);
      } catch {
        if (!cancelled) {
          setLoadingReviews(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [targetType, targetId]);

  // Load more reviews
  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    try {
      const moreReviews = await getReviews(targetType, targetId, nextPage, PAGE_SIZE);
      setReviews((prev) => [...prev, ...moreReviews]);
      setPage(nextPage);
      setHasMore(moreReviews.length === PAGE_SIZE);
    } catch {
      // Silently fail — user can retry
    }
  }, [page, targetType, targetId]);

  // Submit review
  const handleSubmit = useCallback(async () => {
    // Validate rating
    if (formRating < 1 || formRating > 5) {
      setFormError('Please select a rating.');
      return;
    }

    // Validate text
    const validation = validateReviewText(formText);
    if (!validation.valid) {
      setFormError(validation.error ?? 'Invalid review text.');
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const saved = await submitReview({
        userId: currentUserId,
        authorName: displayName,
        targetType,
        targetId,
        rating: formRating,
        text: formText.trim(),
      });

      // Refresh reviews and aggregation
      const [agg, freshReviews] = await Promise.all([
        getAggregation(targetType, targetId),
        getReviews(targetType, targetId, 1, PAGE_SIZE),
      ]);

      setAggregation(agg);
      setReviews(freshReviews);
      setPage(1);
      setHasMore(freshReviews.length === PAGE_SIZE);

      // Reset form
      setFormRating(0);
      setFormText('');
      setShowForm(false);
    } catch {
      setFormError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [formRating, formText, targetType, targetId, currentUserId, displayName]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section>
      <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
        Reviews
      </h2>

      {/* Offline indicator */}
      {!isOnline && (
        <div className="mb-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Showing cached reviews. Connect to see the latest.
          </p>
        </div>
      )}

      {/* Aggregate rating */}
      {aggregation && (
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-brand-charcoal dark:text-dark-text">
              {aggregation.totalCount > 0 ? aggregation.averageRating.toFixed(1) : '—'}
            </span>
            {aggregation.totalCount > 0 && (
              <StarRatingDisplay rating={aggregation.averageRating} />
            )}
          </div>
          <span className="text-sm text-brand-charcoal/60 dark:text-dark-text-muted">
            {aggregation.totalCount} {aggregation.totalCount === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      )}

      {/* Write a Review button */}
      {isAuthenticated && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mb-4 w-full rounded-lg border border-brand-teal/20 bg-brand-teal/5 px-4 py-3 min-h-[44px] text-sm font-medium text-brand-teal hover:bg-brand-teal/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          ✍️ Write a Review
        </button>
      )}

      {/* Review submission form */}
      {showForm && (
        <div className="mb-4 rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 p-4">
          <h3 className="text-sm font-semibold text-brand-charcoal dark:text-dark-text mb-3">
            Your Review
          </h3>

          {/* Star rating selector */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-brand-charcoal/60 dark:text-dark-text-muted mb-1">
              Rating
            </label>
            <StarRatingSelector value={formRating} onChange={setFormRating} />
          </div>

          {/* Text input */}
          <div className="mb-3">
            <label
              htmlFor="review-text"
              className="block text-xs font-medium text-brand-charcoal/60 dark:text-dark-text-muted mb-1"
            >
              Review (10–2000 characters)
            </label>
            <textarea
              id="review-text"
              value={formText}
              onChange={(e) => {
                setFormText(e.target.value);
                setFormError(null);
              }}
              rows={4}
              maxLength={2000}
              placeholder="Share your experience..."
              className="w-full rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white dark:bg-dark-surface px-3 py-2 text-sm text-brand-charcoal dark:text-dark-text placeholder:text-brand-charcoal/40 dark:placeholder:text-dark-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 resize-none"
            />
            <p className="mt-1 text-xs text-brand-charcoal/40 dark:text-dark-text-muted/50">
              {formText.trim().length}/2000
            </p>
          </div>

          {/* Error message */}
          {formError && (
            <p className="mb-3 text-xs text-red-600 dark:text-red-400" role="alert">
              {formError}
            </p>
          )}

          {/* Form actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-lg bg-brand-teal text-white font-semibold text-sm py-3 min-h-[44px] hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormError(null);
                setFormRating(0);
                setFormText('');
              }}
              className="rounded-lg border border-brand-charcoal/10 dark:border-dark-border px-4 py-3 min-h-[44px] text-sm text-brand-charcoal/60 dark:text-dark-text-muted hover:bg-brand-charcoal/5 dark:hover:bg-dark-border/50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {loadingReviews ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-brand-charcoal/10 dark:border-dark-border p-3">
              <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-1/3 mb-2" />
              <div className="h-3 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-full mb-1" />
              <div className="h-3 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-brand-charcoal/60 dark:text-dark-text-muted">
          No reviews yet. Be the first to share your experience!
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 p-3"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-medium text-brand-charcoal dark:text-dark-text">
                  {review.authorName}
                </span>
                <span className="text-xs text-brand-charcoal/50 dark:text-dark-text-muted/60">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              <StarRatingDisplay rating={review.rating} />
              <p className="mt-2 text-sm text-brand-charcoal/80 dark:text-dark-text-muted leading-relaxed">
                {review.text}
              </p>
            </div>
          ))}

          {/* Load More button */}
          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              className="w-full rounded-lg border border-brand-charcoal/10 dark:border-dark-border px-4 py-3 min-h-[44px] text-sm font-medium text-brand-teal hover:bg-brand-teal/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
            >
              Load More Reviews
            </button>
          )}
        </div>
      )}
    </section>
  );
}
