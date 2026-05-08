/**
 * ForageWise — Avatar Resolver
 *
 * Shared utility for resolving user avatars and display names.
 * Provides a consistent fallback chain across all components:
 *   1. PocketBase auth store (current user)
 *   2. community_posts collection (any user)
 *   3. IndexedDB userProfileLocal cache
 *   4. null (caller renders default icon)
 */

import { pb } from '@/auth/authService';
import { getRecord } from '@/offline/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AvatarResolution {
  url: string | null;
  displayName: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a full avatar URL from a PocketBase filename.
 * If the filename already starts with "http", it's an OAuth URL — use directly.
 */
function buildAvatarUrl(userId: string, filename: string): string {
  if (filename.startsWith('http')) {
    return filename;
  }
  return `${pb.baseURL}/api/files/_pb_users_auth_/${userId}/${filename}`;
}

/**
 * Default fallback display name when no name can be resolved.
 */
function fallbackDisplayName(userId: string): string {
  return `Forager ${userId.slice(0, 8)}`;
}

// ---------------------------------------------------------------------------
// Main Resolver
// ---------------------------------------------------------------------------

/**
 * Resolves avatar URL and display name for a given userId.
 *
 * Fallback chain:
 *   1. PocketBase auth store — if userId matches the currently authenticated user
 *   2. community_posts — query for a post by this user to get avatarUrl + userName
 *   3. IndexedDB userProfileLocal — cached profile data
 *   4. Returns { url: null, displayName: "Forager <id prefix>" }
 *
 * Each level is wrapped in try/catch so failures at one level
 * gracefully fall through to the next.
 */
export async function resolveAvatar(userId: string): Promise<AvatarResolution> {
  // --- Level 1: PocketBase auth store (current user) ---
  try {
    if (pb.authStore.isValid && pb.authStore.record) {
      const record = pb.authStore.record as Record<string, unknown>;
      if (record.id === userId) {
        const name =
          (record.name as string) ||
          (record.displayName as string) ||
          (record.email as string) ||
          fallbackDisplayName(userId);

        let url: string | null = null;
        if (record.avatar) {
          url = buildAvatarUrl(userId, String(record.avatar));
        } else if (record.avatarUrl) {
          url = buildAvatarUrl(userId, String(record.avatarUrl));
        }

        return { url, displayName: name };
      }
    }
  } catch {
    // Auth store access failed — continue to next level
  }

  // --- Level 2: community_posts collection ---
  try {
    const result = await pb.collection('community_posts').getList(1, 1, {
      filter: `userId = "${userId}"`,
    });

    if (result.items.length > 0) {
      const post = result.items[0];
      const displayName =
        (post.userName as string) ||
        (post.displayName as string) ||
        fallbackDisplayName(userId);

      let url: string | null = null;
      const avatarValue = post.avatarUrl as string | undefined;
      if (avatarValue) {
        url = buildAvatarUrl(userId, avatarValue);
      }

      return { url, displayName };
    }
  } catch {
    // PocketBase query failed (offline, network error, etc.) — continue
  }

  // --- Level 3: IndexedDB userProfileLocal cache ---
  try {
    const cached = await getRecord('userProfileLocal', userId);
    if (cached) {
      const displayName = cached.displayName || fallbackDisplayName(userId);
      let url: string | null = null;
      if (cached.avatar) {
        url = buildAvatarUrl(userId, cached.avatar);
      }
      return { url, displayName };
    }
  } catch {
    // IndexedDB access failed — continue to default
  }

  // --- Level 4: Default fallback ---
  return { url: null, displayName: fallbackDisplayName(userId) };
}
