'use client';

/**
 * CommunityFeed — Instagram-style feed of public community sightings,
 * trips, and check-ins.
 *
 * Shows posts as cards with user info, images, like/share actions,
 * location, species guess, notes, and timestamps.
 * Photos are loaded from IndexedDB blobs and displayed as object URLs.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
  displayName?: string;
  avatarUrl?: string;
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

  // Load feed items: from PocketBase (shared) + local fallback
  useEffect(() => {
    setLikedIds(getLikedIds());
    setFollowedUsers(getFollowedUsers());

    async function loadFeed() {
      const items: FeedItem[] = [];
      let pbLoaded = false;

      // Try loading from PocketBase first (shared feed)
      try {
        const { fetchCommunityPosts } = await import('@/services/communityPostService');
        const { posts } = await fetchCommunityPosts(1, 50);
        console.log('[CommunityFeed] PocketBase returned', posts.length, 'posts');
        for (const post of posts) {
          items.push({
            id: post.id,
            type: post.postType || 'sighting',
            userId: post.userId,
            displayName: post.displayName,
            avatarUrl: post.avatarUrl,
            title: post.speciesGuess,
            notes: post.notes || '',
            photos: post.photos,
            coordinates: post.coordinates,
            createdAt: post.created,
            parkName: post.postType === 'checkin' ? post.speciesGuess : undefined,
          });
        }
        pbLoaded = posts.length > 0;
      } catch (err) {
        // PocketBase unavailable
        console.warn('[CommunityFeed] PocketBase fetch failed:', err);
      }

      // If PocketBase didn't return anything, use local sightings
      if (!pbLoaded) {
        const publicPosts = sightings
          .filter((s) => s.visibility === 'public')
          .map((s): FeedItem => ({
            id: s.id,
            type: s.notes?.startsWith('[Check-in]') ? 'checkin' : 'sighting',
            userId: s.userId,
            displayName: s.displayName,
            avatarUrl: s.avatarUrl,
            title: s.speciesGuess,
            notes: s.notes?.replace('[Check-in] ', '') || '',
            photos: s.photos || [],
            coordinates: s.coordinates,
            createdAt: s.createdAt,
            parkName: s.notes?.startsWith('[Check-in]') ? s.speciesGuess : undefined,
          }));
        items.push(...publicPosts);
      }

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

  const toggleFollow = useCallback(async (userId: string) => {
    setFollowedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      saveFollowedUsers(next);
      return next;
    });
    // Also persist to IndexedDB for profile display
    try {
      const { putRecord: putRec, getDB: getDatabase } = await import('@/offline/db');
      const db = await getDatabase();
      // Use the current user's auth ID if available
      const authStore = (await import('@/auth/authService')).pb.authStore;
      const currentUserId = authStore.record?.id || 'local-user';
      const followId = `follow-${currentUserId}-${userId}`;
      const existing = await db.get('follows', followId);
      if (existing) {
        await db.delete('follows', followId);
      } else {
        await putRec('follows', {
          id: followId,
          followerId: currentUserId,
          followedId: userId,
          createdAt: new Date().toISOString(),
          syncStatus: 'pending' as const,
        });
      }
    } catch { /* IndexedDB may not be available */ }
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
    <div className="space-y-4 pb-20">
      {/* Not signed in prompt */}
      {!isAuthenticated && (
        <div className="rounded-lg border border-brand-teal/20 bg-brand-teal/5 px-4 py-3 text-center">
          <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70">
            <Link href="/login" className="font-medium text-brand-teal hover:underline">Sign in</Link> to post, like, and interact with the community.
          </p>
        </div>
      )}

      {/* Safety notice removed — now shown as tooltip on community header */}

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

      {/* Fixed Add Post button at bottom */}
      {onAddPost && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4 max-w-lg mx-auto">
          <button
            type="button"
            onClick={onAddPost}
            className="w-full rounded-full bg-brand-teal text-white font-semibold text-sm py-3.5 shadow-lg shadow-brand-teal/30 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-all active:scale-[0.97] min-h-[48px] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Post
          </button>
        </div>
      )}
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
  const displayName = item.displayName || (item.userId && item.userId !== 'local-user' ? `Forager ${item.userId.slice(0, 6)}` : 'Anonymous');
  const timeAgo = getRelativeTime(item.createdAt);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<ThreadedComment[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<Record<string, 1 | -1>>({});
  const lastTapRef = useRef<number>(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load photos — if they're URLs (from PocketBase), use directly; otherwise load from IndexedDB
  useEffect(() => {
    let cancelled = false;
    if (item.photos.length > 0) {
      // Check if photos are already URLs (from PocketBase)
      const allAreUrls = item.photos.every((p) => p.startsWith('http://') || p.startsWith('https://'));
      if (allAreUrls) {
        setPhotoUrls(item.photos);
      } else {
        // Load from IndexedDB
        Promise.all(item.photos.map((id) => loadPhotoUrl(id))).then((urls) => {
          if (!cancelled) {
            setPhotoUrls(urls.filter((u): u is string => u !== null));
          }
        });
      }
    }
    return () => { cancelled = true; };
  }, [item.photos]);

  // Clean up object URLs on unmount (only for blob URLs, not http URLs)
  useEffect(() => {
    return () => {
      photoUrls.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [photoUrls]);

  // Load comments from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`fw_comments_v2_${item.id}`);
      if (stored) {
        setComments(JSON.parse(stored));
      } else {
        // Migrate old string[] comments
        const oldStored = localStorage.getItem(`fw_comments_${item.id}`);
        if (oldStored) {
          const oldComments: string[] = JSON.parse(oldStored);
          const migrated: ThreadedComment[] = oldComments.map((text, i) => ({
            id: `migrated-${i}`,
            text,
            author: 'You',
            timestamp: item.createdAt,
            votes: 0,
            replies: [],
          }));
          setComments(migrated);
          localStorage.setItem(`fw_comments_v2_${item.id}`, JSON.stringify(migrated));
        }
      }
      // Load voted comment IDs
      const votedStored = localStorage.getItem(`fw_votes_${item.id}`);
      if (votedStored) setVotedIds(JSON.parse(votedStored));
    } catch { /* ignore */ }
  }, [item.id, item.createdAt]);

  // Count all comments recursively
  const totalCommentCount = countAllComments(comments);

  // Double-tap to like, single tap to expand
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap — like
      if (!isLiked) onLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
      // Clear the single-tap timer
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
    } else {
      // Single tap — open expanded after delay (to wait for potential double-tap)
      singleTapTimer.current = setTimeout(() => {
        setExpanded(true);
      }, 300);
    }
    lastTapRef.current = now;
  }, [isLiked, onLike]);

  // Add comment (top-level or reply)
  const handleAddComment = useCallback(() => {
    if (!comment.trim()) return;
    const newComment: ThreadedComment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: comment.trim(),
      author: 'You',
      timestamp: new Date().toISOString(),
      votes: 0,
      replies: [],
    };

    let updated: ThreadedComment[];
    if (replyingTo) {
      updated = addReplyToThread(comments, replyingTo, newComment);
      setReplyingTo(null);
    } else {
      updated = [...comments, newComment];
    }
    setComments(updated);
    localStorage.setItem(`fw_comments_v2_${item.id}`, JSON.stringify(updated));
    setComment('');
  }, [comment, comments, item.id, replyingTo]);

  // Vote on a comment (single vote per comment, tap again to cancel)
  const handleVote = useCallback((commentId: string, direction: 1 | -1) => {
    let updated: ThreadedComment[];
    let newVotedIds: Record<string, 1 | -1>;

    if (votedIds[commentId] === direction) {
      // Same direction again — cancel the vote
      updated = voteOnComment(comments, commentId, (direction * -1) as 1 | -1);
      newVotedIds = { ...votedIds };
      delete newVotedIds[commentId];
    } else if (votedIds[commentId]) {
      // Switching direction — undo previous + apply new
      const adjustment = direction * 2;
      updated = voteOnComment(comments, commentId, adjustment as 1 | -1);
      newVotedIds = { ...votedIds, [commentId]: direction };
    } else {
      // Fresh vote
      updated = voteOnComment(comments, commentId, direction);
      newVotedIds = { ...votedIds, [commentId]: direction };
    }

    setComments(updated);
    localStorage.setItem(`fw_comments_v2_${item.id}`, JSON.stringify(updated));
    setVotedIds(newVotedIds);
    localStorage.setItem(`fw_votes_${item.id}`, JSON.stringify(newVotedIds));
  }, [comments, item.id, votedIds]);

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
          <div className="w-9 h-9 rounded-full bg-brand-moss/20 dark:bg-brand-moss/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {item.avatarUrl && item.avatarUrl.startsWith('http') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <svg className="w-5 h-5 text-brand-moss" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            )}
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
        <div
          className="relative w-full aspect-[4/3] bg-brand-charcoal/5 dark:bg-brand-sand/5 cursor-pointer select-none overflow-hidden"
          onClick={handleDoubleTap}
          role="button"
          tabIndex={0}
          aria-label="Double-tap to like, tap to expand"
          onKeyDown={(e) => { if (e.key === 'Enter') setExpanded(true); }}
        >
          {photoUrls.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrls[galleryIndex] || photoUrls[0]}
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
          {/* Gallery dots indicator */}
          {photoUrls.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
              {photoUrls.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === galleryIndex ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
          {/* Gallery counter badge (top-right) */}
          {photoUrls.length > 1 && (
            <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm rounded-md px-2 py-0.5 flex items-center gap-1">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008M6 18h.008M18 6h.008M18 18h.008M3 9.75V4.5A1.5 1.5 0 014.5 3h4.125M3 14.25v5.25A1.5 1.5 0 004.5 21h4.125M21 9.75V4.5A1.5 1.5 0 0019.5 3h-4.125M21 14.25v5.25a1.5 1.5 0 01-1.5 1.5h-4.125" />
              </svg>
              <span className="text-[10px] font-semibold text-white">{galleryIndex + 1}/{photoUrls.length}</span>
            </div>
          )}
          {/* Gallery arrows */}
          {photoUrls.length > 1 && galleryIndex > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => i - 1); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center"
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}
          {photoUrls.length > 1 && galleryIndex < photoUrls.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => i + 1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center"
              aria-label="Next photo"
            >
              ›
            </button>
          )}
          {/* Double-tap heart animation */}
          {showHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping-once">
              <svg className="w-20 h-20 text-red-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Actions: like, comment, share */}
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
          onClick={() => setExpanded(true)}
          aria-label="View comments"
          className="min-h-[44px] min-w-[44px] flex items-center gap-1 justify-center rounded-lg transition-colors hover:bg-brand-charcoal/5 dark:hover:bg-brand-sand/5"
        >
          <svg className="w-6 h-6 text-brand-charcoal/60 dark:text-brand-sand/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          {totalCommentCount > 0 && (
            <span className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">{totalCommentCount}</span>
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

      {/* Expanded image + comments modal — Instagram-style full screen */}
      {expanded && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 z-[10000] flex flex-col bg-white dark:bg-brand-charcoal"
          role="dialog"
          aria-modal="true"
          aria-label="Post detail with comments"
          style={{ height: '100dvh' }}
        >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-charcoal/10 dark:border-brand-sand/10 shrink-0">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <svg className="w-6 h-6 text-brand-charcoal dark:text-brand-sand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand">
                Post
              </span>
              <div className="w-11" />
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Post header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-brand-moss/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.avatarUrl && item.avatarUrl.startsWith('http') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.avatarUrl} alt={displayName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <svg className="w-4 h-4 text-brand-moss" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand">
                  {displayName}
                </span>
              </div>

              {/* Post image gallery */}
              <div className="relative w-full bg-black">
                {photoUrls.length > 0 ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrls[galleryIndex] || photoUrls[0]}
                      alt={item.title || 'Post photo'}
                      className="w-full object-contain"
                      style={{ maxHeight: '45vh' }}
                    />
                    {/* Gallery arrows */}
                    {photoUrls.length > 1 && galleryIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => setGalleryIndex((i) => i - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center text-lg min-h-[44px] min-w-[44px]"
                        aria-label="Previous photo"
                      >
                        ‹
                      </button>
                    )}
                    {photoUrls.length > 1 && galleryIndex < photoUrls.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setGalleryIndex((i) => i + 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center text-lg min-h-[44px] min-w-[44px]"
                        aria-label="Next photo"
                      >
                        ›
                      </button>
                    )}
                    {/* Dots */}
                    {photoUrls.length > 1 && (
                      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
                        {photoUrls.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setGalleryIndex(i)}
                            className={`w-2 h-2 rounded-full transition-all ${i === galleryIndex ? 'bg-white scale-125' : 'bg-white/40'}`}
                            aria-label={`Go to photo ${i + 1}`}
                          />
                        ))}
                      </div>
                    )}
                    {/* Photo counter */}
                    {photoUrls.length > 1 && (
                      <div className="absolute top-3 right-3 bg-black/60 rounded-full px-2.5 py-1 text-[10px] text-white font-medium">
                        {galleryIndex + 1}/{photoUrls.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full aspect-[4/3] flex items-center justify-center bg-brand-charcoal/5 dark:bg-brand-sand/5">
                    <svg className="w-12 h-12 text-brand-charcoal/15 dark:text-brand-sand/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Like/comment/share row */}
              <div className="flex items-center gap-3 px-4 py-2">
                <button type="button" onClick={onLike} aria-label={isLiked ? 'Unlike' : 'Like'} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                  {isLiked ? (
                    <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                  ) : (
                    <svg className="w-6 h-6 text-brand-charcoal/60 dark:text-brand-sand/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                  )}
                </button>
                <button type="button" onClick={onShare} aria-label="Share" className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <svg className="w-6 h-6 text-brand-charcoal/60 dark:text-brand-sand/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                </button>
              </div>

              {/* Caption */}
              {(item.title || item.notes) && (
                <div className="px-4 pb-3">
                  <p className="text-sm text-brand-charcoal dark:text-brand-sand">
                    <span className="font-semibold">{displayName}</span>{' '}
                    {item.title && !item.title.startsWith('[') ? item.title : ''}{item.notes ? ` ${item.notes}` : ''}
                  </p>
                  <time className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40 mt-1 block">{timeAgo}</time>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-brand-charcoal/5 dark:border-brand-sand/5" />

              {/* Top comment (highest voted) */}
              {comments.length > 0 && (() => {
                const topComment = [...comments].sort((a, b) => b.votes - a.votes)[0];
                if (topComment && topComment.votes > 0) {
                  return (
                    <div className="px-4 py-2 bg-brand-teal/5 dark:bg-brand-teal/10 border-b border-brand-charcoal/5 dark:border-brand-sand/5">
                      <p className="text-[10px] font-semibold text-brand-teal uppercase tracking-wide mb-1">Top Comment</p>
                      <p className="text-xs text-brand-charcoal dark:text-brand-sand">
                        <span className="font-semibold">{topComment.author}</span>{' '}{topComment.text}
                      </p>
                      <span className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40">▲ {topComment.votes}</span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Comments list */}
              <div className="px-4 py-3">
                {comments.length === 0 ? (
                  <p className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40 text-center py-6">
                    No comments yet. Start the conversation.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {comments.map((c) => (
                      <CommentThread
                        key={c.id}
                        comment={c}
                        depth={0}
                        onVote={handleVote}
                        onReply={(id) => { setReplyingTo(id); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Comment input — pinned at very bottom, above everything */}
            <div className="shrink-0 bg-white dark:bg-brand-charcoal border-t border-brand-charcoal/10 dark:border-brand-sand/10 px-4 py-3 mb-5 flex flex-col gap-2">
              {replyingTo && (
                <div className="flex items-center justify-between text-xs text-brand-teal">
                  <span>Replying to comment...</span>
                  <button type="button" onClick={() => setReplyingTo(null)} className="text-brand-charcoal/50 dark:text-brand-sand/50 hover:text-brand-charcoal dark:hover:text-brand-sand" aria-label="Cancel reply">✕</button>
                </div>
              )}
              <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-moss/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {item.avatarUrl && item.avatarUrl.startsWith('http') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.avatarUrl} alt="Your avatar" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <svg className="w-4 h-4 text-brand-moss" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                )}
              </div>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
                placeholder="Add a comment..."
                className="flex-1 rounded-full border border-brand-charcoal/15 dark:border-brand-sand/15 bg-brand-sand/30 dark:bg-brand-charcoal/60 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 min-h-[44px]"
                aria-label="Write a comment"
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!comment.trim()}
                className="text-sm font-semibold text-brand-teal disabled:text-brand-charcoal/30 dark:disabled:text-brand-sand/30 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Post comment"
              >
                Post
              </button>
              </div>
            </div>
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Threaded Comments System
// ---------------------------------------------------------------------------

interface ThreadedComment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  votes: number;
  replies: ThreadedComment[];
}

function addReplyToThread(comments: ThreadedComment[], parentId: string, reply: ThreadedComment): ThreadedComment[] {
  return comments.map((c) => {
    if (c.id === parentId) {
      return { ...c, replies: [...c.replies, reply] };
    }
    if (c.replies.length > 0) {
      return { ...c, replies: addReplyToThread(c.replies, parentId, reply) };
    }
    return c;
  });
}

function voteOnComment(comments: ThreadedComment[], commentId: string, direction: 1 | -1): ThreadedComment[] {
  return comments.map((c) => {
    if (c.id === commentId) {
      return { ...c, votes: c.votes + direction };
    }
    if (c.replies.length > 0) {
      return { ...c, replies: voteOnComment(c.replies, commentId, direction) };
    }
    return c;
  });
}

function countAllComments(comments: ThreadedComment[]): number {
  let count = 0;
  for (const c of comments) {
    count += 1;
    if (c.replies.length > 0) {
      count += countAllComments(c.replies);
    }
  }
  return count;
}

function CommentThread({ comment, depth, onVote, onReply }: {
  comment: ThreadedComment;
  depth: number;
  onVote: (id: string, dir: 1 | -1) => void;
  onReply: (id: string) => void;
}) {
  const commentTime = getRelativeTime(comment.timestamp);
  const indent = Math.min(depth * 16, 48);

  return (
    <div style={{ marginLeft: `${indent}px` }}>
      <div className="flex items-start gap-2 py-2">
        {/* Avatar */}
        <div className="w-6 h-6 rounded-full bg-brand-moss/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-3 h-3 text-brand-moss" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          {/* Author + text */}
          <p className="text-sm text-brand-charcoal dark:text-brand-sand">
            <span className="font-semibold text-xs">{comment.author}</span>{' '}
            <span className="text-xs">{comment.text}</span>
          </p>

          {/* Meta row: time, votes, reply */}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40">{commentTime}</span>

            {/* Upvote */}
            <button
              type="button"
              onClick={() => onVote(comment.id, 1)}
              className="flex items-center gap-0.5 text-[10px] text-brand-charcoal/50 dark:text-brand-sand/50 hover:text-brand-teal transition-colors min-h-[28px]"
              aria-label="Upvote"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            </button>

            {/* Vote count */}
            <span className={`text-[10px] font-semibold ${comment.votes > 0 ? 'text-brand-teal' : comment.votes < 0 ? 'text-red-400' : 'text-brand-charcoal/40 dark:text-brand-sand/40'}`}>
              {comment.votes}
            </span>

            {/* Downvote */}
            <button
              type="button"
              onClick={() => onVote(comment.id, -1)}
              className="flex items-center gap-0.5 text-[10px] text-brand-charcoal/50 dark:text-brand-sand/50 hover:text-red-400 transition-colors min-h-[28px]"
              aria-label="Downvote"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Reply */}
            <button
              type="button"
              onClick={() => onReply(comment.id)}
              className="text-[10px] font-medium text-brand-charcoal/50 dark:text-brand-sand/50 hover:text-brand-teal transition-colors min-h-[28px] flex items-center"
              aria-label="Reply to this comment"
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies.length > 0 && (
        <div className="border-l-2 border-brand-charcoal/5 dark:border-brand-sand/10 ml-3">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onVote={onVote}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
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
