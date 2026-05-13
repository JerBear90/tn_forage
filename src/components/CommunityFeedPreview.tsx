'use client';

/**
 * ForageWise — CommunityFeedPreview Component
 *
 * Displays up to 3 recent public community posts on the home page.
 * Each post shows the author display name and a content preview
 * (notes truncated to 100 chars with ellipsis).
 * Tapping a post navigates to `/community`.
 *
 * Requirements: 8.1, 8.4, 8.5, 8.6, 8.7
 */

import Link from 'next/link';
import { useLiveCommunity } from '@/hooks/useLiveCommunity';

/**
 * Truncate text to a maximum length, appending ellipsis if truncated.
 * For notes of 100 characters or fewer, the full text is returned.
 */
export function truncatePreview(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

export default function CommunityFeedPreview() {
  const { posts, loading, error } = useLiveCommunity();

  if (loading) {
    return (
      <section aria-label="Community feed preview" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
            Community Sightings
          </h2>
        </div>
        <div className="space-y-2" aria-busy="true" aria-live="polite">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-brand-charcoal/5 dark:bg-brand-sand/5 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="Community feed preview" className="space-y-3">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          Community Sightings
        </h2>
        <div
          role="alert"
          className="rounded-lg border border-brand-earth/20 bg-brand-earth/10 p-4 text-center"
        >
          <p className="text-sm text-brand-earth dark:text-brand-earth-200">
            Unable to load community sightings.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Community feed preview" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          Community Sightings
        </h2>
        <Link
          href="/community"
          className="text-sm font-medium text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          View all →
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/60 dark:bg-dark-surface/60 p-6 text-center">
          <p className="text-sm text-brand-charcoal/60 dark:text-dark-text-muted">
            Explore the community
          </p>
          <Link
            href="/community"
            className="inline-block mt-2 text-sm font-medium text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Go to community page"
          >
            Go to Community →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href="/community"
                className="block rounded-xl border border-brand-teal/10 bg-white/80 dark:bg-dark-surface/80 px-4 py-3 transition-colors hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
                aria-label={`Post by ${post.authorName}. ${truncatePreview(post.notes)}`}
              >
                <p className="font-semibold text-sm text-brand-charcoal dark:text-dark-text">
                  {post.authorName}
                </p>
                {post.notes && (
                  <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted mt-0.5">
                    {truncatePreview(post.notes)}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
