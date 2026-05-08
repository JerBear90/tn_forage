'use client';

/**
 * ForageWise — FindsTimeline Component
 *
 * Instagram-style grid showing the user's posts from PocketBase community_posts.
 * Each card shows a photo (or placeholder), species name, and date.
 * Clicking a post opens a full-screen detail modal with comments.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { pb } from '@/auth/authService';
import { fetchComments, createComment, type PostComment } from '@/services/commentsService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FindEntry {
  id: string;
  speciesName: string;
  date: string;
  photoUrl: string | null;
  isIdRequest: boolean;
  notes?: string;
  coordinates?: { lat: number; lng: number };
}

// ---------------------------------------------------------------------------
// localStorage likes helpers
// ---------------------------------------------------------------------------

const LIKES_KEY = 'foragewise_feed_likes';

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FindsTimeline({ userId }: { userId: string }) {
  const [finds, setFinds] = useState<FindEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFind, setSelectedFind] = useState<FindEntry | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFinds() {
      try {
        const effectiveUserId = pb.authStore.record?.id || userId;
        const result = await pb.collection('community_posts').getList(1, 30, {
          filter: `userId = "${effectiveUserId}"`,
          sort: '-created',
        });

        if (cancelled) return;

        const entries: FindEntry[] = result.items.map((record) => {
          const photos = record.photos as string[] | string | undefined;
          let photoUrl: string | null = null;
          if (photos) {
            const files = Array.isArray(photos) ? photos : [photos];
            if (files[0]) {
              photoUrl = `${pb.baseURL}/api/files/community_posts/${record.id}/${files[0]}`;
            }
          }

          const coords = record.coordinates as { lat: number; lng: number } | undefined;

          return {
            id: record.id,
            speciesName: (record.speciesGuess as string) || (record.notes as string)?.slice(0, 30) || 'Post',
            date: record.created as string,
            photoUrl,
            isIdRequest: ((record.speciesGuess as string) || '').startsWith('[ID Request]'),
            notes: (record.notes as string) || undefined,
            coordinates: coords || undefined,
          };
        });

        setFinds(entries);
      } catch {
        // PocketBase may not be available
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFinds();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-square rounded-lg bg-brand-charcoal/10 dark:bg-brand-sand/10 animate-pulse" />
        ))}
      </div>
    );
  }

  if (finds.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-3xl mb-2 block" aria-hidden="true">🍄</span>
        <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60">
          No posts yet. Share your discoveries with the community!
        </p>
        <Link
          href="/community#feed"
          className="inline-block mt-3 text-xs font-medium text-brand-teal hover:underline"
        >
          Go to Community →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1" role="list" aria-label="Your posts">
        {finds.map((find) => (
          <button
            key={find.id}
            type="button"
            role="listitem"
            onClick={() => setSelectedFind(find)}
            aria-label={`View post: ${find.isIdRequest ? find.speciesName.replace('[ID Request] ', '') : find.speciesName}`}
            className="relative aspect-square rounded-lg overflow-hidden bg-brand-charcoal/5 dark:bg-brand-charcoal/20 group hover:ring-2 hover:ring-brand-teal/40 transition-shadow min-h-[44px] min-w-[44px] text-left"
          >
            {find.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={find.photoUrl}
                alt={find.speciesName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-teal/10 to-brand-moss/10">
                <span className="text-2xl" aria-hidden="true">
                  {find.isIdRequest ? '🔍' : '🍄'}
                </span>
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 pt-4">
              <p className="text-[9px] font-medium text-white leading-tight truncate">
                {find.isIdRequest ? find.speciesName.replace('[ID Request] ', '') : find.speciesName}
              </p>
              {find.date && (
                <p className="text-[8px] text-white/70">
                  {new Date(find.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>

            {/* Badge */}
            {find.isIdRequest && (
              <div className="absolute top-1 left-1">
                <span className="inline-block rounded px-1 py-0.5 text-[7px] font-bold bg-amber-500 text-white">ID</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="text-center pt-1">
        <Link href="/community#feed" className="text-xs font-medium text-brand-teal hover:underline">
          View all in Feed →
        </Link>
      </div>

      {/* Detail Modal */}
      {selectedFind && (
        <FindDetailModal
          find={selectedFind}
          onClose={() => setSelectedFind(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Find Detail Modal
// ---------------------------------------------------------------------------

function FindDetailModal({ find, onClose }: { find: FindEntry; onClose: () => void }) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);

  // Check initial like state
  useEffect(() => {
    setLiked(getLikedIds().has(find.id));
  }, [find.id]);

  // Load comments
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await fetchComments(find.id);
      if (!cancelled) setComments(result);
    }
    load();
    return () => { cancelled = true; };
  }, [find.id]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function handleLike() {
    const ids = getLikedIds();
    if (ids.has(find.id)) {
      ids.delete(find.id);
      setLiked(false);
    } else {
      ids.add(find.id);
      setLiked(true);
    }
    saveLikedIds(ids);
  }

  async function handleAddComment() {
    const text = commentText.trim();
    if (!text) return;
    setSubmitting(true);
    const newComment = await createComment({ postId: find.id, text });
    if (newComment) {
      setComments((prev) => [newComment, ...prev]);
      setCommentText('');
    }
    setSubmitting(false);
  }

  const displayName = find.isIdRequest
    ? find.speciesName.replace('[ID Request] ', '')
    : find.speciesName;

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col bg-white dark:bg-brand-charcoal"
      role="dialog"
      aria-modal="true"
      aria-label="Post detail"
      style={{ height: '100dvh' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-charcoal/10 dark:border-brand-sand/10 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Go back"
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Post image */}
        {find.photoUrl ? (
          <div className="w-full bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={find.photoUrl}
              alt={displayName}
              className="w-full object-contain"
              style={{ maxHeight: '50vh' }}
            />
          </div>
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-brand-teal/10 to-brand-moss/10">
            <span className="text-5xl" aria-hidden="true">
              {find.isIdRequest ? '🔍' : '🍄'}
            </span>
          </div>
        )}

        {/* Like row */}
        <div className="flex items-center gap-3 px-4 py-2">
          <button
            type="button"
            onClick={handleLike}
            aria-label={liked ? 'Unlike' : 'Like'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {liked ? (
              <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-brand-charcoal/60 dark:text-brand-sand/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            )}
          </button>
        </div>

        {/* Species / Title */}
        <div className="px-4 pb-2">
          <h2 className="text-base font-semibold text-brand-charcoal dark:text-brand-sand">
            {displayName}
          </h2>
        </div>

        {/* Notes */}
        {find.notes && (
          <div className="px-4 pb-3">
            <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80">
              {find.notes}
            </p>
          </div>
        )}

        {/* Date */}
        {find.date && (
          <div className="px-4 pb-2">
            <time className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50">
              {new Date(find.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
        )}

        {/* Coordinates */}
        {find.coordinates && (
          <div className="px-4 pb-3">
            <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50">
              📍 {find.coordinates.lat.toFixed(5)}, {find.coordinates.lng.toFixed(5)}
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-brand-charcoal/5 dark:border-brand-sand/5" />

        {/* Comments */}
        <div className="px-4 py-3">
          <h3 className="text-xs font-semibold text-brand-charcoal/60 dark:text-brand-sand/60 uppercase tracking-wide mb-3">
            Comments
          </h3>
          {comments.length === 0 ? (
            <p className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40 text-center py-6">
              No comments yet. Start the conversation.
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex flex-col gap-0.5">
                  <p className="text-sm text-brand-charcoal dark:text-brand-sand">
                    <span className="font-semibold">{c.userName}</span>{' '}
                    {c.text}
                  </p>
                  <span className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40">
                    {new Date(c.created).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    {c.votes > 0 && ` · ▲ ${c.votes}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comment input — pinned at bottom */}
      <div className="shrink-0 bg-white dark:bg-brand-charcoal border-t border-brand-charcoal/10 dark:border-brand-sand/10 px-3 py-3 mb-5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !submitting) handleAddComment(); }}
            placeholder="Add a comment..."
            className="flex-1 min-w-0 rounded-full border border-brand-charcoal/15 dark:border-brand-sand/15 bg-brand-sand/30 dark:bg-brand-charcoal/60 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 min-h-[44px]"
            aria-label="Write a comment"
          />
          <button
            type="button"
            onClick={handleAddComment}
            disabled={!commentText.trim() || submitting}
            className="text-sm font-semibold text-brand-teal disabled:text-brand-charcoal/30 dark:disabled:text-brand-sand/30 min-h-[44px] px-2 shrink-0"
            aria-label="Post comment"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
