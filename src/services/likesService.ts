/**
 * ForageWise — Likes Service
 * Manages post likes via localStorage.
 * Falls back gracefully if localStorage unavailable.
 */

const LIKES_KEY = 'foragewise_feed_likes';

function getLocalLikes(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveLocalLikes(ids: Set<string>) {
  localStorage.setItem(LIKES_KEY, JSON.stringify(Array.from(ids)));
}

export async function toggleLike(postId: string): Promise<boolean> {
  // Always update localStorage for instant UI feedback
  const likes = getLocalLikes();
  const isNowLiked = !likes.has(postId);
  if (isNowLiked) likes.add(postId);
  else likes.delete(postId);
  saveLocalLikes(likes);
  return isNowLiked;
}

export function isLiked(postId: string): boolean {
  return getLocalLikes().has(postId);
}

export function getLikedIds(): Set<string> {
  return getLocalLikes();
}
