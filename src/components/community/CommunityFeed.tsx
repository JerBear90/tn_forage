'use client';

/**
 * CommunityFeed — Instagram-style feed of public community sightings.
 *
 * Shows posts as cards with user info, images, like/share actions,
 * location, species guess, notes, and timestamps.
 */

import { useState, useEffect, useCallback } from 'react';
import type { CommunityDraft } from '@/types';

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const LIKES_KEY = 'foragewise_feed_likes';
const FOLLOWS_KEY = 'foragewise_feed_follows';

function getLikedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveLikedIds(ids: Set<string>) {
  localStorage.setItem(LIKES_KEY, JSON.stringify(Array.from(ids)));
}

function getFollowedUsers(): Set<string> {
  try {
    const raw = localStorage.getItem(FOLLOWS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveFollowedUsers(ids: Set<string>) {
  localStorage.setItem(FOLLOWS_KEY, JSON.stringify(Array.from(ids)));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CommunityFeedProps {
  sightings: CommunityDraft[];
}

export default function CommunityFeed({ sightings }: CommunityFeedProps) {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setLikedIds(getLikedIds());
    setFollowedUsers(getFollowedUsers());
  }, []);

  // Filter to public only, sort most recent first
  const publicPosts = sightings
    .filter((s) => s.visibility === 'public')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const toggleLike = useCallback((id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveLikedIds(next);
      return next;
    });
  }, []);

  const toggleFollow = useCallback((userId: string) => {
    setFollowedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      saveFollowedUsers(next);
      return next;
    });
  }, []);

  const handleShare = useCallback(async (post: CommunityDraft) => {
    const shareData = {
      title: post.speciesGuess || 'Community Find',
      text: post.notes || 'Check out this find on ForageWise!',
      url: `${window.location.origin}/community#feed`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed — ignore
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        setCopiedId(post.id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        // Clipboard not available
      }
    }
  }, []);

  // Empty state
  if (publicPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="w-16 h-16 text-brand-charcoal/20 dark:text-brand-sand/20 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
          />
        </svg>
        <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60">
          No posts yet. Be the first to share a find!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {publicPosts.map((post) => (
        <FeedCard
          key={post.id}
          post={post}
          isLiked={likedIds.has(post.id)}
          isFollowed={followedUsers.has(post.userId)}
          isCopied={copiedId === post.id}
          onLike={() => toggleLike(post.id)}
          onFollow={() => toggleFollow(post.userId)}
          onShare={() => handleShare(post)}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feed Card
// ---------------------------------------------------------------------------

interface FeedCardProps {
  post: CommunityDraft;
  isLiked: boolean;
  isFollowed: boolean;
  isCopied: boolean;
  onLike: () => void;
  onFollow: () => void;
  onShare: () => void;
}

function FeedCard({ post, isLiked, isFollowed, isCopied, onLike, onFollow, onShare }: FeedCardProps) {
  const displayName = post.userId ? `Forager ${post.userId.slice(0, 6)}` : 'Anonymous';
  const timeAgo = getRelativeTime(post.createdAt);
  const hasPhoto = post.photos && post.photos.length > 0;

  return (
    <article
      className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/50 overflow-hidden"
      aria-label={`Post by ${displayName}: ${post.speciesGuess || 'Unknown species'}`}
    >
      {/* Header: avatar, name, follow */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div className="w-9 h-9 rounded-full bg-brand-moss/20 dark:bg-brand-moss/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-brand-moss" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand">
            {displayName}
          </span>
        </div>
        <button
          type="button"
          onClick={onFollow}
          aria-label={isFollowed ? `Unfollow ${displayName}` : `Follow ${displayName}`}
          className={`rounded-full text-xs px-3 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
            isFollowed
              ? 'bg-brand-charcoal/10 dark:bg-brand-sand/10 text-brand-charcoal dark:text-brand-sand'
              : 'bg-brand-teal text-white'
          }`}
        >
          {isFollowed ? 'Following' : 'Follow'}
        </button>
      </div>

      {/* Image */}
      <div className="relative w-full aspect-[4/3] bg-brand-charcoal/5 dark:bg-brand-sand/5">
        {hasPhoto ? (
          <img
            src={post.photos[0]}
            alt={post.speciesGuess || 'Community sighting photo'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-brand-charcoal/15 dark:text-brand-sand/15"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Actions: like, share */}
      <div className="flex items-center gap-2 px-4 pt-3">
        <button
          type="button"
          onClick={onLike}
          aria-label={isLiked ? 'Unlike this post' : 'Like this post'}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors hover:bg-brand-charcoal/5 dark:hover:bg-brand-sand/5"
        >
          {isLiked ? (
            <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-brand-charcoal/60 dark:text-brand-sand/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onShare}
          aria-label="Share this post"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors hover:bg-brand-charcoal/5 dark:hover:bg-brand-sand/5"
        >
          <svg className="w-6 h-6 text-brand-charcoal/60 dark:text-brand-sand/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
        </button>
        {isCopied && (
          <span className="text-xs text-brand-teal ml-2">Link copied!</span>
        )}
      </div>

      {/* Content: location, species, notes, time */}
      <div className="px-4 pb-4 pt-2 space-y-1.5">
        {/* Location */}
        {post.coordinates && (
          <div className="flex items-center gap-1 text-xs text-brand-charcoal/50 dark:text-brand-sand/50">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span>{post.coordinates.lat.toFixed(3)}, {post.coordinates.lng.toFixed(3)}</span>
          </div>
        )}

        {/* Species guess as title */}
        {post.speciesGuess && (
          <h3 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand">
            {post.speciesGuess}
          </h3>
        )}

        {/* Notes */}
        {post.notes && (
          <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 line-clamp-3">
            {post.notes}
          </p>
        )}

        {/* Timestamp */}
        <time
          dateTime={post.createdAt}
          className="block text-xs text-brand-charcoal/40 dark:text-brand-sand/40 pt-1"
        >
          {timeAgo}
        </time>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Relative time helper
// ---------------------------------------------------------------------------

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
