/**
 * ForageFlow — Review Service
 *
 * Handles review validation, submission (with upsert semantics),
 * retrieval with pagination, and aggregation computation.
 * All data is persisted to IndexedDB and queued for sync when offline.
 *
 * Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7
 */

import { getDB, putRecord } from '@/offline/db';
import type {
  ReviewLocal,
  ReviewTargetType,
  ReviewAggregationLocal,
  SyncStatus,
} from '@/types';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate review text length (10–2000 characters after trimming).
 *
 * @param text - The raw review text to validate
 * @returns An object with `valid: true` or `valid: false` with an error message
 */
export function validateReviewText(text: string): { valid: boolean; error?: string } {
  const trimmed = text.trim();

  if (trimmed.length < 10) {
    return { valid: false, error: 'Review must be at least 10 characters.' };
  }

  if (trimmed.length > 2000) {
    return { valid: false, error: 'Review must be 2000 characters or fewer.' };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Submit Review (upsert — one review per user per target)
// ---------------------------------------------------------------------------

/**
 * Submit or update a review. Enforces one review per user per target entity.
 * If a review already exists for the same userId + targetType + targetId,
 * the existing review is updated (upsert). Otherwise a new review is created.
 *
 * The review is saved to the IndexedDB `reviews` store and enqueued in the
 * `syncQueue` store for background synchronisation.
 *
 * @param review - Review data without id, timestamps, or syncStatus
 * @returns The saved ReviewLocal record
 */
export async function submitReview(
  review: Omit<ReviewLocal, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>,
): Promise<ReviewLocal> {
  const db = await getDB();
  const now = new Date().toISOString();

  // Look for an existing review by this user for this target
  const allForTarget = await db.getAllFromIndex(
    'reviews',
    'by-targetType-targetId',
    [review.targetType, review.targetId],
  );

  const existing = allForTarget.find((r) => r.userId === review.userId);

  let savedReview: ReviewLocal;

  if (existing) {
    // Upsert: update the existing review
    savedReview = {
      ...existing,
      rating: review.rating,
      text: review.text,
      authorName: review.authorName,
      updatedAt: now,
      syncStatus: 'pending' as SyncStatus,
    };
  } else {
    // Create a new review
    savedReview = {
      id: crypto.randomUUID(),
      userId: review.userId,
      authorName: review.authorName,
      targetType: review.targetType,
      targetId: review.targetId,
      rating: review.rating,
      text: review.text,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending' as SyncStatus,
    };
  }

  // Persist to IndexedDB reviews store
  await putRecord('reviews', savedReview);

  // Enqueue in sync queue for offline-first sync
  await putRecord('syncQueue', {
    localId: crypto.randomUUID(),
    serverId: undefined,
    userId: review.userId,
    collection: 'reviews',
    operation: existing ? 'update' : 'create',
    payload: savedReview,
    payloadHash: '',
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    retryCount: 0,
    clientVersion: 1,
  });

  return savedReview;
}

// ---------------------------------------------------------------------------
// Get Reviews (paginated, sorted by createdAt descending)
// ---------------------------------------------------------------------------

/**
 * Retrieve reviews for a target entity, sorted by most recent first.
 *
 * @param targetType - The type of entity being reviewed
 * @param targetId   - The ID of the target entity
 * @param page       - 1-based page number
 * @param pageSize   - Number of reviews per page (default 10)
 * @returns An array of ReviewLocal records for the requested page
 */
export async function getReviews(
  targetType: ReviewTargetType,
  targetId: string,
  page: number,
  pageSize: number = 10,
): Promise<ReviewLocal[]> {
  const db = await getDB();

  const reviews = await db.getAllFromIndex(
    'reviews',
    'by-targetType-targetId',
    [targetType, targetId],
  );

  // Sort by createdAt descending (most recent first)
  reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Paginate
  const start = (page - 1) * pageSize;
  return reviews.slice(start, start + pageSize);
}

// ---------------------------------------------------------------------------
// Get Aggregation (average rating + total count)
// ---------------------------------------------------------------------------

/**
 * Compute the aggregate rating for a target entity from IndexedDB.
 *
 * @param targetType - The type of entity
 * @param targetId   - The ID of the target entity
 * @returns An object with `averageRating` (1 decimal place) and `totalCount`
 */
export async function getAggregation(
  targetType: ReviewTargetType,
  targetId: string,
): Promise<ReviewAggregationLocal> {
  const db = await getDB();

  const reviews = await db.getAllFromIndex(
    'reviews',
    'by-targetType-targetId',
    [targetType, targetId],
  );

  if (reviews.length === 0) {
    return {
      id: `${targetType}-${targetId}`,
      targetType,
      targetId,
      averageRating: 0,
      totalCount: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = Math.round((sum / reviews.length) * 10) / 10;

  return {
    id: `${targetType}-${targetId}`,
    targetType,
    targetId,
    averageRating,
    totalCount: reviews.length,
    lastUpdated: new Date().toISOString(),
  };
}
