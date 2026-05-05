/**
 * ForageWise — Admin Content Moderation Service
 *
 * Provides functions for moderating community sightings (approve, flag, remove)
 * and managing blog articles (CRUD). All moderation actions are logged to the
 * `admin_moderation_log` collection for audit purposes.
 */

import { pb } from '@/auth/authService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Status of a community sighting */
export type SightingStatus = 'pending' | 'approved' | 'flagged' | 'removed';

/** Moderation action that can be performed on a sighting */
export type ModerationAction = 'approve' | 'flag' | 'remove';

/** A community sighting record for the moderation list */
export interface SightingRecord {
  id: string;
  title: string;
  description: string;
  species: string;
  location: string;
  status: SightingStatus;
  userId: string;
  userName: string;
  createdAt: string;
  imageUrl?: string;
}

/** Paginated result for sightings */
export interface SightingListResult {
  items: SightingRecord[];
  totalItems: number;
  totalPages: number;
  page: number;
}

/** A blog article record */
export interface BlogArticle {
  id: string;
  title: string;
  body: string;
  author: string;
  tags: string[];
  featuredImage: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Paginated result for blog articles */
export interface BlogArticleListResult {
  items: BlogArticle[];
  totalItems: number;
  totalPages: number;
  page: number;
}

/** Data for creating or updating a blog article */
export interface BlogArticleData {
  title: string;
  body: string;
  author: string;
  tags: string[];
  featuredImage: string;
  published?: boolean;
}

// ---------------------------------------------------------------------------
// Sighting Moderation
// ---------------------------------------------------------------------------

/**
 * Fetch community sightings with optional status filter and pagination.
 *
 * @param status - Optional status filter (pending, approved, flagged, removed).
 * @param page - Page number (1-indexed).
 * @param perPage - Number of items per page.
 * @returns Paginated sighting list result.
 */
export async function getSightings(
  status?: SightingStatus,
  page: number = 1,
  perPage: number = 20,
): Promise<SightingListResult> {
  let filter = '';
  if (status) {
    filter = `status = '${status}'`;
  }

  const result = await pb.collection('community_sightings').getList(page, perPage, {
    sort: '-created',
    filter: filter || undefined,
    expand: 'userId',
  });

  const items: SightingRecord[] = result.items.map((record) => {
    const expanded = record.expand?.['userId'] as Record<string, unknown> | undefined;
    return {
      id: record.id,
      title: (record['title'] as string) ?? '',
      description: (record['description'] as string) ?? '',
      species: (record['species'] as string) ?? '',
      location: (record['location'] as string) ?? '',
      status: ((record['status'] as string) ?? 'pending') as SightingStatus,
      userId: (record['userId'] as string) ?? '',
      userName: (expanded?.['name'] as string) ?? (expanded?.['email'] as string) ?? 'Unknown',
      createdAt: (record['created'] as string) ?? '',
      imageUrl: (record['image'] as string) || undefined,
    };
  });

  return {
    items,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    page: result.page,
  };
}

/**
 * Moderate a community sighting by changing its status and logging the action.
 *
 * @param sightingId - The PocketBase record ID of the sighting.
 * @param action - The moderation action: approve, flag, or remove.
 * @param reason - Optional reason for the moderation action.
 */
export async function moderateSighting(
  sightingId: string,
  action: ModerationAction,
  reason?: string,
): Promise<void> {
  // Map action to status
  const statusMap: Record<ModerationAction, SightingStatus> = {
    approve: 'approved',
    flag: 'flagged',
    remove: 'removed',
  };

  const newStatus = statusMap[action];

  // Update the sighting status
  await pb.collection('community_sightings').update(sightingId, {
    status: newStatus,
  });

  // Log the moderation action for audit
  await pb.collection('admin_moderation_log').create({
    targetId: sightingId,
    targetType: 'sighting',
    action,
    moderatorId: pb.authStore.record?.id ?? '',
    timestamp: new Date().toISOString(),
    reason: reason ?? '',
  });
}

// ---------------------------------------------------------------------------
// Blog Article Management
// ---------------------------------------------------------------------------

/**
 * Fetch blog articles with pagination.
 *
 * @param page - Page number (1-indexed).
 * @param perPage - Number of items per page.
 * @returns Paginated blog article list result.
 */
export async function getBlogArticles(
  page: number = 1,
  perPage: number = 20,
): Promise<BlogArticleListResult> {
  const result = await pb.collection('blog_articles').getList(page, perPage, {
    sort: '-created',
  });

  const items: BlogArticle[] = result.items.map((record) => ({
    id: record.id,
    title: (record['title'] as string) ?? '',
    body: (record['body'] as string) ?? '',
    author: (record['author'] as string) ?? '',
    tags: parseTags(record['tags']),
    featuredImage: (record['featuredImage'] as string) ?? '',
    published: (record['published'] as boolean) ?? false,
    createdAt: (record['created'] as string) ?? '',
    updatedAt: (record['updated'] as string) ?? '',
  }));

  return {
    items,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    page: result.page,
  };
}

/**
 * Create a new blog article.
 *
 * @param data - The blog article data.
 * @returns The created blog article.
 */
export async function createBlogArticle(data: BlogArticleData): Promise<BlogArticle> {
  const record = await pb.collection('blog_articles').create({
    title: data.title,
    body: data.body,
    author: data.author,
    tags: JSON.stringify(data.tags),
    featuredImage: data.featuredImage,
    published: data.published ?? true,
  });

  return {
    id: record.id,
    title: (record['title'] as string) ?? '',
    body: (record['body'] as string) ?? '',
    author: (record['author'] as string) ?? '',
    tags: parseTags(record['tags']),
    featuredImage: (record['featuredImage'] as string) ?? '',
    published: (record['published'] as boolean) ?? false,
    createdAt: (record['created'] as string) ?? '',
    updatedAt: (record['updated'] as string) ?? '',
  };
}

/**
 * Update an existing blog article.
 *
 * @param id - The PocketBase record ID of the article.
 * @param data - The updated blog article data.
 * @returns The updated blog article.
 */
export async function updateBlogArticle(id: string, data: Partial<BlogArticleData>): Promise<BlogArticle> {
  const updatePayload: Record<string, unknown> = {};
  if (data.title !== undefined) updatePayload['title'] = data.title;
  if (data.body !== undefined) updatePayload['body'] = data.body;
  if (data.author !== undefined) updatePayload['author'] = data.author;
  if (data.tags !== undefined) updatePayload['tags'] = JSON.stringify(data.tags);
  if (data.featuredImage !== undefined) updatePayload['featuredImage'] = data.featuredImage;
  if (data.published !== undefined) updatePayload['published'] = data.published;

  const record = await pb.collection('blog_articles').update(id, updatePayload);

  return {
    id: record.id,
    title: (record['title'] as string) ?? '',
    body: (record['body'] as string) ?? '',
    author: (record['author'] as string) ?? '',
    tags: parseTags(record['tags']),
    featuredImage: (record['featuredImage'] as string) ?? '',
    published: (record['published'] as boolean) ?? false,
    createdAt: (record['created'] as string) ?? '',
    updatedAt: (record['updated'] as string) ?? '',
  };
}

/**
 * Unpublish a blog article (set published to false).
 *
 * @param id - The PocketBase record ID of the article.
 */
export async function unpublishBlogArticle(id: string): Promise<void> {
  await pb.collection('blog_articles').update(id, { published: false });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse tags from a PocketBase record field.
 * Tags may be stored as a JSON string array or already as an array.
 */
function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // If not valid JSON, try comma-separated
      return value.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }
  return [];
}
