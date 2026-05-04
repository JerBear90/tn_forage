"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/auth/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getFeed, getCachedFeed } from "@/social/activityFeedService";
import {
  getActionLabel,
  getDetailLink,
  computeHasMore,
  sortFeedItems,
  FEED_PAGE_SIZE,
} from "@/social/feedHelpers";
import type { FeedItemLocal } from "@/types";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FeedPage() {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const currentUserId = user?.id ?? 'guest';

  const [feedItems, setFeedItems] = useState<FeedItemLocal[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usingCache, setUsingCache] = useState(false);

  // Load feed on mount
  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      setLoading(true);
      try {
        let items: FeedItemLocal[];
        if (isOnline) {
          items = await getFeed(currentUserId, 1, FEED_PAGE_SIZE);
          setUsingCache(false);
        } else {
          items = await getCachedFeed(currentUserId);
          setUsingCache(true);
        }
        if (!cancelled) {
          setFeedItems(sortFeedItems(items));
          setHasMore(computeHasMore(items.length));
          setPage(1);
        }
      } catch {
        // Fall back to cached feed on error
        try {
          const cached = await getCachedFeed(currentUserId);
          if (!cancelled) {
            setFeedItems(sortFeedItems(cached));
            setHasMore(false);
            setUsingCache(true);
          }
        } catch {
          // IndexedDB may not be available
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFeed();
    return () => {
      cancelled = true;
    };
  }, [isOnline, currentUserId]);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (!isOnline || loading) return;
    const nextPage = page + 1;
    setLoading(true);
    try {
      const items = await getFeed(currentUserId, nextPage, FEED_PAGE_SIZE);
      setFeedItems((prev) => sortFeedItems([...prev, ...items]));
      setHasMore(computeHasMore(items.length));
      setPage(nextPage);
    } catch {
      // silently fail — keep existing items
    } finally {
      setLoading(false);
    }
  }, [isOnline, loading, page, currentUserId]);

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
            Activity Feed
          </h1>
          {!isOnline && (
            <span
              aria-label="You are offline"
              className="inline-flex items-center gap-1 rounded-full bg-brand-earth/15 dark:bg-brand-earth/25 px-2.5 py-0.5 text-xs font-medium text-brand-earth dark:text-amber-300 border border-brand-earth/30 dark:border-amber-400/30"
            >
              <svg
                aria-hidden="true"
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3l18 18"
                />
              </svg>
              Offline
            </span>
          )}
        </div>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Recent activity from people you follow.
        </p>
      </header>

      {/* Offline cache banner */}
      {usingCache && (
        <div
          role="status"
          className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-300"
        >
          Showing cached activity. Connect to refresh.
        </div>
      )}

      {/* Loading state */}
      {loading && feedItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
          <p className="mt-3 text-sm text-brand-charcoal/60 dark:text-brand-sand/60">
            Loading feed…
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && feedItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl mb-3" aria-hidden="true">
            📡
          </span>
          <p className="font-heading font-semibold text-brand-charcoal dark:text-brand-sand">
            No activity yet
          </p>
          <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60 mt-1 max-w-xs">
            Follow other foragers to see their reviews, photos, trips, and
            achievements here.
          </p>
        </div>
      )}

      {/* Feed items */}
      {feedItems.length > 0 && (
        <ul className="space-y-3" aria-label="Activity feed">
          {feedItems.map((item) => (
            <li key={item.id}>
              <Link
                href={getDetailLink(item)}
                className="flex items-start gap-3 rounded-xl bg-white/80 dark:bg-brand-charcoal/60 border border-brand-teal/10 p-4 hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[56px]"
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border border-brand-teal/20 bg-brand-teal/10 flex items-center justify-center">
                  {item.userAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.userAvatar}
                      alt={`${item.userName}'s avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 text-brand-teal/40"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-brand-charcoal dark:text-brand-sand">
                    <span className="font-semibold">{item.userName}</span>{" "}
                    <span className="text-brand-charcoal/70 dark:text-brand-sand/70">
                      {getActionLabel(item.actionType)}
                    </span>
                  </p>
                  <p className="text-sm font-medium text-brand-teal mt-0.5 truncate">
                    {item.targetName}
                  </p>
                  <time
                    dateTime={item.createdAt}
                    className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 mt-1 block"
                  >
                    {formatRelativeTime(item.createdAt)}
                  </time>
                </div>

                {/* Chevron */}
                <svg
                  aria-hidden="true"
                  className="flex-shrink-0 w-4 h-4 text-brand-charcoal/30 dark:text-brand-sand/30 mt-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Load More button */}
      {hasMore && !usingCache && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg bg-brand-teal text-white text-sm font-semibold px-6 py-3 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {loading ? "Loading…" : "Load More"}
          </button>
        </div>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Relative time formatter
// ---------------------------------------------------------------------------

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return isoString;
  }
}
