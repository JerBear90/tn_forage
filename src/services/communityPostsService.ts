/**
 * ForageWise — Community Posts Service
 *
 * Fetches community posts from PocketBase (online) with fallback to
 * local IndexedDB (offline). Handles creating new posts and syncing.
 */

import { pb } from '@/auth/authService';
import { getAllRecords, putRecord } from '@/offline/db';
import type { CommunityDraft } from '@/types';

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  speciesGuess: string;
  notes: string;
  visibility: 'public' | 'private';
  coordinates: { lat: number; lng: number } | null;
  photos: string[];
  created: string;
  updated: string;
}

/**
 * Fetch public community posts from PocketBase.
 * Falls back to local IndexedDB if offline or request fails.
 */
export async function getCommunityPosts(page: number = 1, perPage: number = 20): Promise<{
  posts: CommunityPost[];
  totalPages: number;
  isFromCache: boolean;
}> {
  // Try PocketBase first
  try {
    const result = await pb.collection('community_posts').getList(page, perPage, {
      sort: '-created',
      filter: 'visibility = "public"',
    });

    const posts: CommunityPost[] = result.items.map((item) => ({
      id: item.id,
      userId: item['userId'] as string ?? '',
      userName: item['userName'] as string ?? 'Anonymous',
      speciesGuess: item['speciesGuess'] as string ?? '',
      notes: item['notes'] as string ?? '',
      visibility: (item['visibility'] as string ?? 'public') as 'public' | 'private',
      coordinates: item['coordinates'] as { lat: number; lng: number } | null,
      photos: (item['photos'] as string[] ?? []).map((filename) =>
        pb.files.getURL(item, filename, { thumb: '400x300' })
      ),
      created: item['created'] as string ?? '',
      updated: item['updated'] as string ?? '',
    }));

    // Cache posts locally for offline access
    for (const post of posts) {
      try {
        await putRecord('communityDrafts', {
          id: post.id,
          userId: post.userId,
          speciesGuess: post.speciesGuess || undefined,
          photos: post.photos,
          coordinates: post.coordinates ?? undefined,
          notes: post.notes,
          visibility: post.visibility,
          createdAt: post.created,
          updatedAt: post.updated,
        });
      } catch { /* cache is best-effort */ }
    }

    return { posts, totalPages: result.totalPages, isFromCache: false };
  } catch {
    // Offline or error — fall back to local cache
    const localDrafts = await getAllRecords('communityDrafts');
    const posts: CommunityPost[] = localDrafts
      .filter((d) => d.visibility === 'public')
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      .slice(0, perPage)
      .map((d) => ({
        id: d.id,
        userId: d.userId,
        userName: 'Local User',
        speciesGuess: d.speciesGuess ?? '',
        notes: d.notes,
        visibility: d.visibility as 'public' | 'private',
        coordinates: d.coordinates ?? null,
        photos: d.photos ?? [],
        created: d.createdAt ?? '',
        updated: d.updatedAt ?? '',
      }));

    return { posts, totalPages: 1, isFromCache: true };
  }
}

/**
 * Create a new community post. Saves to PocketBase if online,
 * otherwise saves locally and queues for sync.
 */
export async function createCommunityPost(post: {
  speciesGuess: string;
  notes: string;
  visibility: 'public' | 'private';
  coordinates?: { lat: number; lng: number };
  userName?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const userId = pb.authStore.record?.id ?? 'local-user';
  const userName = post.userName ?? pb.authStore.record?.['name'] ?? 'Anonymous';

  // Try PocketBase first
  try {
    const record = await pb.collection('community_posts').create({
      userId,
      userName,
      speciesGuess: post.speciesGuess,
      notes: post.notes,
      visibility: post.visibility,
      coordinates: post.coordinates ?? null,
    });

    return { success: true, id: record.id };
  } catch {
    // Offline — save locally
    const id = crypto.randomUUID?.() ?? `local-${Date.now()}`;
    await putRecord('communityDrafts', {
      id,
      userId,
      speciesGuess: post.speciesGuess || undefined,
      photos: [],
      coordinates: post.coordinates,
      notes: post.notes,
      visibility: post.visibility,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true, id };
  }
}

/**
 * Sync all local-only community posts to PocketBase.
 * Finds posts in IndexedDB that haven't been synced and pushes them.
 * Returns the number of posts successfully synced.
 */
export async function syncLocalPosts(): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;

  try {
    const localDrafts = await getAllRecords('communityDrafts');
    const userId = pb.authStore.record?.id;
    const userName = pb.authStore.record?.['name'] as string ?? 'Anonymous';

    if (!userId) return { synced: 0, failed: 0 };

    for (const draft of localDrafts) {
      // Skip posts that came from PocketBase (they have short IDs like "abc123def456")
      // Local posts have UUIDs or "local-" prefix
      const isLocal = draft.id.includes('-') && draft.id.length > 20;
      if (!isLocal) continue;

      try {
        await pb.collection('community_posts').create({
          userId,
          userName,
          speciesGuess: draft.speciesGuess ?? '',
          notes: draft.notes,
          visibility: draft.visibility,
          coordinates: draft.coordinates ?? null,
        });
        synced++;
      } catch {
        failed++;
      }
    }
  } catch {
    // PocketBase not available
  }

  return { synced, failed };
}
