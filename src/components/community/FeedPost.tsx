'use client';

/**
 * ForageWise — FeedPost Component
 *
 * Instagram-style post card with Reddit-style nested comments.
 * - Double-tap outer post to like (tap again to unlike)
 * - Species image from local data
 * - Comment count on outer post
 * - Nested comments with upvote (one vote per comment, double-click cancels)
 * - Suggest ID and Report at bottom of inner post
 * - No "public" pill on outer post
 * - Gallery support for multiple photos
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { CommunityDraft } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  upvotes: number;
  userVoted: boolean;
  replies: Comment[];
}

export interface FeedPostProps {
  post: CommunityDraft;
  speciesImage: string | null;
  isAuthenticated: boolean;
  onFlag?: (postId: string) => void;
  onSuggestId?: (postId: string) => void;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

// ---------------------------------------------------------------------------
// Comment Component (recursive for nesting)
// ---------------------------------------------------------------------------

function CommentItem({
  comment,
  depth = 0,
  isAuthenticated,
  onUpvote,
}: {
  comment: Comment;
  depth?: number;
  isAuthenticated: boolean;
  onUpvote: (commentId: string) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');

  return (
    <div className={`${depth > 0 ? 'ml-4 border-l-2 border-brand-charcoal/10 dark:border-dark-border pl-3' : ''}`}>
      <div className="py-2">
        <div className="flex items-start gap-2">
          {/* Upvote */}
          <button
            type="button"
            onClick={() => onUpvote(comment.id)}
            className={`shrink-0 flex flex-col items-center gap-0.5 pt-0.5 ${
              comment.userVoted ? 'text-brand-teal' : 'text-brand-charcoal/40 dark:text-brand-sand/40'
            }`}
            aria-label={comment.userVoted ? 'Remove upvote' : 'Upvote'}
          >
            <svg className="w-3.5 h-3.5" fill={comment.userVoted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
            <span className="text-[10px] font-medium">{comment.upvotes}</span>
          </button>

          {/* Comment content */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-brand-charcoal/50 dark:text-brand-sand/50">
              <span className="font-medium text-brand-charcoal/70 dark:text-brand-sand/70">{comment.userName}</span>
              {' · '}{timeAgo(comment.createdAt)}
            </p>
            <p className="text-xs text-brand-charcoal/80 dark:text-brand-sand/80 mt-0.5 leading-relaxed">
              {comment.text}
            </p>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setShowReply(!showReply)}
                className="text-[10px] text-brand-teal mt-1 hover:underline"
              >
                Reply
              </button>
            )}
          </div>
        </div>

        {/* Reply input */}
        {showReply && (
          <div className="ml-6 mt-2 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 rounded border border-brand-teal/20 bg-white dark:bg-brand-charcoal/60 px-2 py-1.5 text-xs text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 focus:outline-none focus:ring-1 focus:ring-brand-teal/40"
            />
            <button
              type="button"
              onClick={() => { setShowReply(false); setReplyText(''); }}
              className="text-xs text-brand-teal font-medium px-2"
            >
              Post
            </button>
          </div>
        )}
      </div>

      {/* Nested replies */}
      {comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          isAuthenticated={isAuthenticated}
          onUpvote={onUpvote}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main FeedPost Component
// ---------------------------------------------------------------------------

export default function FeedPost({ post, speciesImage, isAuthenticated, onFlag, onSuggestId }: FeedPostProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [lastTap, setLastTap] = useState(0);

  // Double-tap to like
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap — toggle like
      setLiked((prev) => {
        setLikeCount((c) => prev ? c - 1 : c + 1);
        return !prev;
      });
    }
    setLastTap(now);
  }, [lastTap]);

  // Upvote a comment (toggle)
  const handleUpvote = useCallback((commentId: string) => {
    setComments((prev) => prev.map((c) => {
      if (c.id === commentId) {
        return { ...c, userVoted: !c.userVoted, upvotes: c.userVoted ? c.upvotes - 1 : c.upvotes + 1 };
      }
      return { ...c, replies: c.replies.map((r) => r.id === commentId ? { ...r, userVoted: !r.userVoted, upvotes: r.userVoted ? r.upvotes - 1 : r.upvotes + 1 } : r) };
    }));
  }, []);

  // Add comment
  const handleAddComment = useCallback(() => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      userId: 'local-user',
      userName: 'You',
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
      upvotes: 0,
      userVoted: false,
      replies: [],
    };
    setComments((prev) => [...prev, newComment]);
    setCommentText('');
  }, [commentText]);

  const userName = post.userId?.replace('demo-user-', '').replace('local-user', 'You') || 'Anonymous';

  return (
    <article className="rounded-xl border border-brand-charcoal/10 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden">
      {/* Header — user info */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="w-8 h-8 rounded-full bg-brand-teal/10 flex items-center justify-center text-sm font-bold text-brand-teal">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-brand-charcoal dark:text-dark-text capitalize">{userName}</p>
          <p className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40">{timeAgo(post.createdAt)}</p>
        </div>
      </div>

      {/* Image — species match or placeholder */}
      <div
        className="w-full aspect-square bg-brand-sand/60 dark:bg-dark-surface/80 relative cursor-pointer"
        onClick={handleTap}
        role="button"
        aria-label="Double-tap to like"
      >
        {speciesImage ? (
          <img src={speciesImage} alt={post.speciesGuess || 'Observation'} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-30">🍄</span>
          </div>
        )}
        {/* Like animation overlay */}
        {liked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-4xl animate-ping">❤️</span>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-4 px-3 py-2">
        <button
          type="button"
          onClick={() => setLiked((prev) => { setLikeCount((c) => prev ? c - 1 : c + 1); return !prev; })}
          className={`flex items-center gap-1 ${liked ? 'text-red-500' : 'text-brand-charcoal/60 dark:text-brand-sand/60'}`}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          {likeCount > 0 && <span className="text-xs font-medium">{likeCount}</span>}
        </button>
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-brand-charcoal/60 dark:text-brand-sand/60"
          aria-label="Comments"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          {comments.length > 0 && <span className="text-xs font-medium">{comments.length}</span>}
        </button>
      </div>

      {/* Caption */}
      <div className="px-3 pb-2">
        {post.speciesGuess && (
          <p className="text-xs font-semibold text-brand-charcoal dark:text-dark-text mb-0.5">
            {post.speciesGuess}
          </p>
        )}
        <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70 leading-relaxed line-clamp-3">
          {post.notes}
        </p>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-brand-charcoal/5 dark:border-dark-border px-3 py-2">
          {comments.length === 0 && (
            <p className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40 text-center py-2">No comments yet</p>
          )}
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isAuthenticated={isAuthenticated}
              onUpvote={handleUpvote}
            />
          ))}

          {/* Add comment input */}
          {isAuthenticated && (
            <div className="flex gap-2 mt-2 pt-2 border-t border-brand-charcoal/5 dark:border-dark-border">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
                placeholder="Add a comment..."
                className="flex-1 rounded-full border border-brand-charcoal/15 dark:border-dark-border bg-brand-charcoal/5 dark:bg-brand-charcoal/30 px-3 py-1.5 text-xs text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 focus:outline-none focus:ring-1 focus:ring-brand-teal/40"
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                className="text-xs font-semibold text-brand-teal disabled:opacity-40"
              >
                Post
              </button>
            </div>
          )}

          {/* Suggest ID + Report — bottom of inner post */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-charcoal/5 dark:border-dark-border">
            {isAuthenticated && onSuggestId && (
              <button
                type="button"
                onClick={() => onSuggestId(post.id)}
                className="text-[10px] text-brand-teal font-medium hover:underline"
              >
                🔍 Suggest ID
              </button>
            )}
            {isAuthenticated && onFlag && (
              <button
                type="button"
                onClick={() => onFlag(post.id)}
                className="text-[10px] text-red-500/70 font-medium hover:underline"
              >
                🚩 Report
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
