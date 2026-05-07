/**
 * ForageWise — Community Post Service
 *
 * Handles reading and writing community posts to PocketBase.
 * Matches the live PocketHost community_posts collection schema.
 */

import { pb } from '@/auth/authService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommunityPost {
  id: string;
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  speciesGuess?: string;
  notes?: string;
  coordinates?: { lat: number; lng: number };
  postType: 'sighting' | 'checkin' | 'trip';
  photos: string[]; // PocketBase file URLs
  created: string;
  updated: string;
}

export interface CreatePostData {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  speciesGuess?: string;
  notes?: string;
  coordinates?: { lat: number; lng: number };
  postType: 'sighting' | 'checkin' | 'trip';
  photoFiles?: File[];
}

// ---------------------------------------------------------------------------
// Fetch posts from PocketBase (public feed)
// ---------------------------------------------------------------------------

export async function fetchCommunityPosts(page = 1, perPage = 20): Promise<{
  posts: CommunityPost[];
  totalPages: number;
}> {
  try {
    const result = await pb.collection('community_posts').getList(page, perPage, {
      sort: '-created',
      filter: 'visibility = "public"',
    });

    const posts: CommunityPost[] = result.items.map((record) => {
      // Build photo URLs from PocketBase file fields
      const photoFiles = record.photos as string[] | string | undefined;
      let photoUrls: string[] = [];
      if (photoFiles) {
        const files = Array.isArray(photoFiles) ? photoFiles : [photoFiles];
        photoUrls = files
          .filter((f) => f)
          .map((filename) => pb.files.getURL(record, filename));
      }

      return {
        id: record.id,
        userId: (record.userId as string) || '',
        displayName: (record.userName as string) || (record.displayName as string) || undefined,
        avatarUrl: (record.avatarUrl as string) || undefined,
        speciesGuess: (record.speciesGuess as string) || undefined,
        notes: (record.notes as string) || undefined,
        coordinates: record.coordinates as { lat: number; lng: number } | undefined,
        postType: (record.postType as 'sighting' | 'checkin' | 'trip') || 'sighting',
        photos: photoUrls,
        created: record.created as string,
        updated: record.updated as string,
      };
    });

    return { posts, totalPages: result.totalPages };
  } catch (err) {
    console.error('[CommunityPostService] Failed to fetch posts:', err);
    return { posts: [], totalPages: 0 };
  }
}

// ---------------------------------------------------------------------------
// Create a post on PocketBase
// ---------------------------------------------------------------------------

export async function createCommunityPost(data: CreatePostData): Promise<CommunityPost | null> {
  try {
    const formData = new FormData();
    formData.append('userId', data.userId);
    formData.append('userName', data.displayName || 'Anonymous');
    if (data.displayName) formData.append('displayName', data.displayName);
    if (data.avatarUrl) formData.append('avatarUrl', data.avatarUrl);
    if (data.speciesGuess) formData.append('speciesGuess', data.speciesGuess);
    if (data.notes) formData.append('notes', data.notes);
    formData.append('visibility', 'public');
    if (data.coordinates) formData.append('coordinates', JSON.stringify(data.coordinates));
    if (data.postType) formData.append('postType', data.postType);

    // Attach photo files
    if (data.photoFiles) {
      for (const file of data.photoFiles) {
        formData.append('photos', file);
      }
    }

    const record = await pb.collection('community_posts').create(formData);

    const photoFiles = record.photos as string[] | string | undefined;
    let photoUrls: string[] = [];
    if (photoFiles) {
      const files = Array.isArray(photoFiles) ? photoFiles : [photoFiles];
      photoUrls = files
        .filter((f) => f)
        .map((filename) => pb.files.getURL(record, filename));
    }

    return {
      id: record.id,
      userId: (record.userId as string) || '',
      displayName: (record.userName as string) || (record.displayName as string) || undefined,
      avatarUrl: (record.avatarUrl as string) || undefined,
      speciesGuess: (record.speciesGuess as string) || undefined,
      notes: (record.notes as string) || undefined,
      coordinates: record.coordinates as { lat: number; lng: number } | undefined,
      postType: (record.postType as 'sighting' | 'checkin' | 'trip') || 'sighting',
      photos: photoUrls,
      created: record.created as string,
      updated: record.updated as string,
    };
  } catch (err) {
    console.error('[CommunityPostService] Failed to create post:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Check if PocketBase is reachable
// ---------------------------------------------------------------------------

export function isPocketBaseOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine && !!pb.authStore.token;
}
