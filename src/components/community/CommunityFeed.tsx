'use client';

/**
 * CommunityFeed — Instagram-style feed of public community sightings,
 * trips, and check-ins.
 *
 * Shows posts as cards with user info, images, like/share actions,
 * location, species guess, notes, and timestamps.
 * Photos are loaded from IndexedDB blobs and displayed as object URLs.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/auth/useAuth';
import type { CommunityDraft, Trip } from '@/types';
import { getAllRecords, getDB } from '@/offline/db';

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
// Photo loading from IndexedDB
// ---------------------------------------------------------------------------

async function loadPhotoUrl(photoId: string): Promise<string | null> {
  try {
    const db = await getDB();
    const photo = await db.get('photos', photoId);
    if (photo?.blob) {
      return URL.createObjectURL(photo.blob);
    }
  } catch {
    // Photo not found in store
  }
  return null;
}

// ---------------------------------------------------------------------------
// Unified Feed Item type
// ---------------------------------------------------------------------------

interface FeedItem {
  id: string;
  type: 'sighting' | 'trip' | 'checkin';
  userId: string;
  title?: string;
  notes: string;
  photos: string[]; // photo IDs
  coordinates?: { lat: number; lng: number };
  createdAt: string;
  // Trip-specific
  tripDate?: string;
  tripLocation?: string;
  targetSpecies?: string[];
  // Check-in specific
  parkName?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CommunityFeedProps {
  sightings: CommunityDraft[];
  onAddPost?: () => void;
}

export default function CommunityFeed({ sightings, onAddPost }: CommunityFeedProps) {
  const { isAuthenticated } = useAuth();
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load feed items: public sightings + shared trips
  useEffect(() => {
    setLikedIds(getLikedIds());
    setFollowedUsers(getFollowedUsers());

    async function loadFeed() {
      const items: FeedItem[] = [];

      // Public sightings (including check-ins)
      const publicPosts = sightings
        .filter((s) => s.visibility === 'public')
        .map((s): FeedItem => ({
          id: s.id,
          type: s.notes?.startsWith('[Check-in]') ? 'checkin' : 'sighting',
          userId: s.userId,
          title: s.speciesGuess,
          notes: s.notes?.replace('[Check-in] ', '') || '',
          photos: s.photos || [],
          coordinates: s.coordinates,
          createdAt: s.createdAt,
          parkName: s.notes?.startsWith('[Check-in]') ? s.speciesGuess : undefined,
        }));
      items.push(...publicPosts);

      // Shared trips (those with syncStatus 'pending' and marked as shared)
      try {
        const trips = await getAllRecords('trips') as Trip[];
        const sharedTripIds = getSharedTripIds();
        const sharedTrips = trips.filter((t) => sharedTripIds.has(t.id));
        for (const trip of sharedTrips) {
          items.push({
            id: `trip-${trip.id}`,
            type: 'trip',
            userId: trip.userId,
            title: trip.customLocation || trip.locationId || 'Foraging Trip',
            notes: trip.notes || '',
            photos: [],
            createdAt: trip.date,
            tripDate: trip.date,
            tripLocation: trip.customLocation || trip.locationId || '',
            targetSpecies: trip.targetSpecies,
          });
        }
      } catch {
        // trips store may not exist
      }

      // Sort all items newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setFeedItems(items);
      setLoading(false);
    }

    loadFeed();
  }, [sightings]);

  const toggleLike = useCallback((id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveLikedIds(next);
      return next;
    });
  }, []);

  const toggleFollow = useCallback((userId: string) => {
    setFollowedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      saveFollowedUsers(next);
      return next;
    });
  }, []);

  const handleShare = useCallback(async (item: FeedItem) => {
    const shareData = {
      title: item.title || 'Community Find',
      text: item.notes || 'Check out this on ForageWise!',
      url: `${window.location.origin}/community#feed`,
    };

    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch { /* clipboard unavailable */ }
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/50 p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Post button */}
      {onAddPost && (
        <button
          type="button"
          onClick={onAddPost}
          className="w-full rounded-lg bg-brand-teal text-white font-semibold text-sm py-3 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98] min-h-[48px] flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Post
        </button>
      )}

      {/* Not signed in prompt */}
      {!isAuthenticated && (
        <div className="rounded-lg border border-brand-teal/20 bg-brand-teal/5 px-4 py-3 text-center">
          <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70">
            <Link href="/login" className="font-medium text-brand-teal hover:underline">Sign in</Link> to post, like, and interact with the community.
          </p>
        </div>
      )}

      {/* Safety notice */}
      <div
        role="note"
        className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-700 dark:text-amber-300"
      >
        Community posts are user-submitted and not verified by experts.
        Always verify with a qualified expert before consuming any wild species.
      </div>

      {/* Empty state */}
      {feedItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            className="w-16 h-16 text-brand-charcoal/20 dark:text-brand-sand/20 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60">
            No posts yet. Be the first to share a find!
          </p>
        </div>
      )}

      {/* Feed cards */}
      {feedItems.map((item) => (
        <FeedCard
          key={item.id}
          item={item}
          isLiked={likedIds.has(item.id)}
          isFollowed={followedUsers.has(item.userId)}
          isCopied={copiedId === item.id}
          onLike={() => toggleLike(item.id)}
          onFollow={() => toggleFollow(item.userId)}
          onShare={() => handleShare(item)}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feed Card
// ---------------------------------------------------------------------------

interface FeedCardProps {
  item: FeedItem;
  isLiked: boolean;
  isFollowed: boolean;
  isCopied: boolean;
  onLike: () => void;
  onFollow: () => void;
  onShare: () => void;
}

function FeedCard({ item, isLiked, isFollowed, isCopied, onLike, onFollow, onShare }: FeedCardProps) {
  const displayName = item.userId ? `Forager ${item.userId.slice(0, 6)}` : 'Anonymous';
  const timeAgo = getRelativeTime(item.createdAt);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Load first photo from IndexedDB
  useEffect(() => {
    let cancelled = false;
    if (item.photos.length > 0) {
      loadPhotoUrl(item.photos[0]).then((url) => {
        if (!cancelled && url) setPhotoUrl(url);
      });
    }
    return () => { cancelled = true; };
  }, [item.photos]);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  // Type badge
  const typeBadge = item.type === 'trip' ? '🗺️ Trip Plan' : item.type === 'checkin' ? '📍 Check-in' : null;

  return (
    <article
      className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/50 overflow-hidden"
      aria-label={`Post by ${displayName}: ${item.title || 'Community post'}`}
    >
      {/* Header: avatar, name, follow */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-moss/20 dark:bg-brand-moss/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-brand-moss" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand block">
              {displayName}
            </span>
            {typeBadge && (
              <span className="text-xs text-brand-teal font-medium">{typeBadge}</span>
            )}
          </div>
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

      {/* Image or Trip Card */}
      {item.type === 'trip' ? (
        <TripCard item={item} />
      ) : (
        <div className="relative w-full aspect-[4/3] bg-brand-charcoal/5 dark:bg-brand-sand/5">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={item.title || 'Community sighting photo'}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
          )}
        </div>
      )}

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
        {item.coordinates && (
          <div className="flex items-center gap-1 text-xs text-brand-charcoal/50 dark:text-brand-sand/50">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span>{item.coordinates.lat.toFixed(3)}, {item.coordinates.lng.toFixed(3)}</span>
          </div>
        )}

        {/* Title */}
        {item.title && !item.title.startsWith('[') && (
          <h3 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand">
            {item.title}
          </h3>
        )}

        {/* Notes */}
        {item.notes && (
          <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 line-clamp-3">
            {item.notes}
          </p>
        )}

        {/* Timestamp */}
        <time
          dateTime={item.createdAt}
          className="block text-xs text-brand-charcoal/40 dark:text-brand-sand/40 pt-1"
        >
          {timeAgo}
        </time>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Trip Card (inline display for trip plans in feed)
// ---------------------------------------------------------------------------

function TripCard({ item }: { item: FeedItem }) {
  return (
    <div className="mx-4 my-2 rounded-lg border border-brand-teal/20 bg-brand-teal/5 dark:bg-brand-teal/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg" aria-hidden="true">🗺️</span>
        <h3 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand">
          {item.title || 'Foraging Trip'}
        </h3>
      </div>
      {item.tripDate && (
        <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mb-1">
          📅 {new Date(item.tripDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
      )}
      {item.tripLocation && (
        <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mb-1">
          📍 {item.tripLocation}
        </p>
      )}
      {item.targetSpecies && item.targetSpecies.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.targetSpecies.slice(0, 4).map((sp) => (
            <span key={sp} className="inline-flex rounded-full bg-brand-moss/15 px-2 py-0.5 text-[10px] text-brand-moss font-medium">
              {sp}
            </span>
          ))}
          {item.targetSpecies.length > 4 && (
            <span className="text-[10px] text-brand-charcoal/50 dark:text-brand-sand/50">
              +{item.targetSpecies.length - 4} more
            </span>
          )}
        </div>
      )}
      {item.notes && (
        <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70 mt-2 line-clamp-2">
          {item.notes}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared trip tracking (localStorage)
// ---------------------------------------------------------------------------

const SHARED_TRIPS_KEY = 'foragewise_shared_trips';

function getSharedTripIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SHARED_TRIPS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markTripAsShared(tripId: string) {
  const ids = getSharedTripIds();
  ids.add(tripId);
  localStorage.setItem(SHARED_TRIPS_KEY, JSON.stringify(Array.from(ids)));
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
