'use client';

import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/auth/authService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FeedbackType = 'bug' | 'suggestion' | 'other';

interface FeedbackEntry {
  id: string;
  userId: string;
  type: FeedbackType;
  description: string;
  deviceInfo: {
    browser?: string;
    os?: string;
    screenSize?: string;
    appVersion?: string;
  } | null;
  createdAt: string;
}

interface FeedbackListResult {
  items: FeedbackEntry[];
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
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function TypeBadge({ type }: { type: FeedbackType }) {
  const styles: Record<FeedbackType, { bg: string; icon: string }> = {
    bug: { bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: '🐛' },
    suggestion: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: '💡' },
    other: { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400', icon: '💬' },
  };

  const style = styles[type] ?? styles.other;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg}`}>
      <span aria-hidden="true">{style.icon}</span>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const PER_PAGE = 15;

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackListResult | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let filter = '';
      if (filterType !== 'all') {
        filter = `type = '${filterType}'`;
      }

      const result = await pb.collection('feedback').getList(page, PER_PAGE, {
        sort: '-created',
        filter: filter || undefined,
      });

      const items: FeedbackEntry[] = result.items.map((r) => ({
        id: r.id,
        userId: (r.userId as string) ?? '',
        type: ((r.type as string) ?? 'other') as FeedbackType,
        description: (r.description as string) ?? '',
        deviceInfo: r.deviceInfo as FeedbackEntry['deviceInfo'] ?? null,
        createdAt: (r.created as string) ?? '',
      }));

      setFeedback({
        items,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, [page, filterType]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    setPage(1);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand">
          User Feedback
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review bug reports, suggestions, and other feedback submitted by users
        </p>
      </div>

      {/* Stats summary */}
      {feedback && (
        <div className="flex flex-wrap gap-4">
          <div className="rounded-lg bg-brand-sand/50 dark:bg-brand-charcoal/50 px-4 py-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
            <p className="text-lg font-bold text-brand-charcoal dark:text-brand-sand">{feedback.totalItems}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter feedback by type">
        {['all', 'bug', 'suggestion', 'other'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleFilterChange(type)}
            aria-pressed={filterType === type}
            className={`min-h-[44px] min-w-[44px] rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
              filterType === type
                ? 'bg-brand-teal text-white'
                : 'bg-brand-sand/50 dark:bg-brand-charcoal/50 text-brand-charcoal dark:text-brand-sand hover:bg-brand-teal/10'
            }`}
          >
            {type === 'all' ? 'All' : type === 'bug' ? '🐛 Bugs' : type === 'suggestion' ? '💡 Suggestions' : '💬 Other'}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400" role="alert">
          {error}
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-3">
        {loading && !feedback ? (
          <div className="flex items-center justify-center py-12" aria-label="Loading feedback">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-teal border-t-transparent" />
          </div>
        ) : feedback && feedback.items.length === 0 ? (
          <div className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/50 p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No feedback found for the selected filter.</p>
          </div>
        ) : (
          feedback?.items.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/50 p-5 shadow-sm"
            >
              {/* Header */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <TypeBadge type={entry.type} />
                  {entry.userId && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                      User: {entry.userId}
                    </span>
                  )}
                </div>
                <time className="text-xs text-gray-500 dark:text-gray-400" dateTime={entry.createdAt}>
                  {formatDate(entry.createdAt)}
                </time>
              </div>

              {/* Description */}
              <p className="mt-3 text-sm text-brand-charcoal dark:text-brand-sand leading-relaxed whitespace-pre-wrap">
                {entry.description}
              </p>

              {/* Device info toggle */}
              {entry.deviceInfo && (
                <>
                  <button
                    type="button"
                    onClick={() => toggleExpand(entry.id)}
                    aria-expanded={expandedIds.has(entry.id)}
                    className="mt-3 min-h-[44px] inline-flex items-center gap-1 text-xs font-medium text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
                  >
                    {expandedIds.has(entry.id) ? 'Hide' : 'Show'} device info
                    <svg
                      className={`h-3 w-3 transition-transform ${expandedIds.has(entry.id) ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedIds.has(entry.id) && (
                    <div className="mt-2 rounded-lg bg-gray-50 dark:bg-brand-charcoal/30 p-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {entry.deviceInfo.browser && <p><span className="font-medium">Browser:</span> {entry.deviceInfo.browser}</p>}
                      {entry.deviceInfo.os && <p><span className="font-medium">OS:</span> {entry.deviceInfo.os}</p>}
                      {entry.deviceInfo.screenSize && <p><span className="font-medium">Screen:</span> {entry.deviceInfo.screenSize}</p>}
                      {entry.deviceInfo.appVersion && <p><span className="font-medium">Version:</span> {entry.deviceInfo.appVersion}</p>}
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {feedback && feedback.totalPages > 1 && (
        <nav className="flex items-center justify-between" aria-label="Feedback pagination">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {feedback.totalPages} ({feedback.totalItems} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-sand/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-sand/20 dark:text-brand-sand"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(feedback.totalPages, p + 1))}
              disabled={page >= feedback.totalPages}
              aria-label="Next page"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-sand/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-sand/20 dark:text-brand-sand"
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
