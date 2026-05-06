'use client';

import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/auth/authService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReviewRecord {
  id: string;
  userId: string;
  authorName: string;
  targetType: 'park' | 'trail' | 'species';
  targetId: string;
  targetName: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface ReviewListResult {
  items: ReviewRecord[];
  totalItems: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function TargetTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    park: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    trail: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    species: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[type] ?? 'bg-gray-100 text-gray-600'}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const PER_PAGE = 15;

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewListResult | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let filter = '';
      if (filterType !== 'all') {
        filter = `targetType = '${filterType}'`;
      }
      if (filterRating !== null) {
        filter += filter ? ` && rating = ${filterRating}` : `rating = ${filterRating}`;
      }

      const result = await pb.collection('reviews').getList(page, PER_PAGE, {
        sort: '-created',
        filter: filter || undefined,
      });

      const items: ReviewRecord[] = result.items.map((r) => ({
        id: r.id,
        userId: (r.userId as string) ?? '',
        authorName: (r.authorName as string) ?? 'Anonymous',
        targetType: (r.targetType as 'park' | 'trail' | 'species') ?? 'park',
        targetId: (r.targetId as string) ?? '',
        targetName: (r.targetName as string) ?? 'Unknown',
        rating: (r.rating as number) ?? 0,
        text: (r.text as string) ?? '',
        createdAt: (r.created as string) ?? '',
      }));

      setReviews({
        items,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterRating]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleFilterTypeChange = (type: string) => {
    setFilterType(type);
    setPage(1);
  };

  const handleFilterRatingChange = (rating: number | null) => {
    setFilterRating(rating);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand">
          User Reviews
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Browse and monitor reviews submitted by users for parks, trails, and species
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Type filter */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by target type">
          {['all', 'park', 'trail', 'species'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleFilterTypeChange(type)}
              aria-pressed={filterType === type}
              className={`min-h-[44px] min-w-[44px] rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                filterType === type
                  ? 'bg-brand-teal text-white'
                  : 'bg-brand-sand/50 dark:bg-brand-charcoal/50 text-brand-charcoal dark:text-brand-sand hover:bg-brand-teal/10'
              }`}
            >
              {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
            </button>
          ))}
        </div>

        {/* Rating filter */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by rating">
          {[null, 5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating ?? 'all'}
              type="button"
              onClick={() => handleFilterRatingChange(rating)}
              aria-pressed={filterRating === rating}
              className={`min-h-[44px] min-w-[44px] rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                filterRating === rating
                  ? 'bg-brand-teal text-white'
                  : 'bg-brand-sand/50 dark:bg-brand-charcoal/50 text-brand-charcoal dark:text-brand-sand hover:bg-brand-teal/10'
              }`}
            >
              {rating === null ? 'All' : `${rating}★`}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400" role="alert">
          {error}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading && !reviews ? (
          <div className="flex items-center justify-center py-12" aria-label="Loading reviews">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-teal border-t-transparent" />
          </div>
        ) : reviews && reviews.items.length === 0 ? (
          <div className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/50 p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No reviews found for the selected filters.</p>
          </div>
        ) : (
          reviews?.items.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/50 p-5 shadow-sm"
            >
              {/* Header row */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <StarRating rating={review.rating} />
                  <TargetTypeBadge type={review.targetType} />
                </div>
                <time className="text-xs text-gray-500 dark:text-gray-400" dateTime={review.createdAt}>
                  {formatDate(review.createdAt)}
                </time>
              </div>

              {/* Target */}
              <p className="mt-2 text-sm font-semibold text-brand-charcoal dark:text-brand-sand">
                {review.targetName}
              </p>

              {/* Review text */}
              {review.text && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {review.text}
                </p>
              )}

              {/* Author */}
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                — {review.authorName}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {reviews && reviews.totalPages > 1 && (
        <nav className="flex items-center justify-between" aria-label="Reviews pagination">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {reviews.totalPages} ({reviews.totalItems} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-sand/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-sand/20 dark:text-brand-sand"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(reviews.totalPages, p + 1))}
              disabled={page >= reviews.totalPages}
              aria-label="Next page"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-sand/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-sand/20 dark:text-brand-sand"
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
