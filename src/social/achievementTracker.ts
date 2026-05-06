/**
 * ForageWise — Achievement Tracker
 *
 * Evaluates user activity against predefined achievement criteria
 * and records earned achievements in IndexedDB. Achievements are
 * queued for sync to PocketBase when offline.
 *
 * Requirements: 5.1, 5.2, 5.6
 */

import { getDB, putRecord } from '@/offline/db';
import type { AchievementLocal, Trip, SyncStatus } from '@/types';

// ---------------------------------------------------------------------------
// Achievement Criteria Definitions
// ---------------------------------------------------------------------------

interface AchievementCriteria {
  id: string;
  title: string;
  description: string;
  evaluate(trips: Trip[]): boolean;
}

/**
 * Built-in achievement criteria evaluated after each trip completion.
 */
const ACHIEVEMENT_CRITERIA: AchievementCriteria[] = [
  {
    id: 'first-forage',
    title: 'First Forage',
    description: 'Completed your first foraging trip.',
    evaluate: (trips) => trips.length >= 1,
  },
  {
    id: 'trail-blazer',
    title: 'Trail Blazer',
    description: 'Completed 5 foraging trips.',
    evaluate: (trips) => trips.length >= 5,
  },
  {
    id: 'park-explorer',
    title: 'Park Explorer',
    description: 'Completed 10 foraging trips.',
    evaluate: (trips) => trips.length >= 10,
  },
  {
    id: 'season-veteran',
    title: 'Season Veteran',
    description: 'Completed trips in all 4 seasons.',
    evaluate: (trips) => {
      const seasons = new Set<string>();
      for (const trip of trips) {
        const month = new Date(trip.date).getMonth();
        if (month >= 2 && month <= 4) seasons.add('Spring');
        else if (month >= 5 && month <= 7) seasons.add('Summer');
        else if (month >= 8 && month <= 10) seasons.add('Fall');
        else seasons.add('Winter');
      }
      return seasons.size === 4;
    },
  },
];

// ---------------------------------------------------------------------------
// Evaluate achievements on trip completion
// ---------------------------------------------------------------------------

/**
 * Evaluate all achievement criteria after a trip is completed.
 *
 * - Fetches the trip from IndexedDB to confirm it exists
 * - Fetches all trips for the user to evaluate criteria
 * - Fetches existing achievements to avoid duplicates
 * - Creates new AchievementLocal records for newly earned achievements
 * - Saves to IndexedDB `achievements` store and enqueues in `syncQueue`
 *
 * @param userId - The user who completed the trip
 * @param tripId - The ID of the completed trip
 * @returns Array of newly earned achievements
 */
export async function evaluateOnTripComplete(
  userId: string,
  tripId: string,
): Promise<AchievementLocal[]> {
  const db = await getDB();

  // Verify the trip exists
  const trip = await db.get('trips', tripId);
  if (!trip) {
    return [];
  }

  // Get all trips for this user
  const allTrips = await db.getAllFromIndex('trips', 'by-userId', userId);

  // Get existing achievements for this user
  const existingAchievements = await db.getAllFromIndex(
    'achievements',
    'by-userId',
    userId,
  );
  const earnedIds = new Set(existingAchievements.map((a) => a.achievementId));

  const now = new Date().toISOString();
  const newAchievements: AchievementLocal[] = [];

  for (const criteria of ACHIEVEMENT_CRITERIA) {
    // Skip if already earned
    if (earnedIds.has(criteria.id)) {
      continue;
    }

    // Evaluate the criteria against all user trips
    if (criteria.evaluate(allTrips)) {
      const achievement: AchievementLocal = {
        id: crypto.randomUUID(),
        userId,
        achievementId: criteria.id,
        title: criteria.title,
        description: criteria.description,
        earnedAt: now,
        syncStatus: 'pending' as SyncStatus,
      };

      // Save to IndexedDB achievements store
      await putRecord('achievements', achievement);

      // Enqueue in sync queue for offline-first sync
      await putRecord('syncQueue', {
        localId: crypto.randomUUID(),
        serverId: undefined,
        userId,
        collection: 'achievements',
        operation: 'create',
        payload: achievement,
        payloadHash: '',
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
        retryCount: 0,
        clientVersion: 1,
      });

      newAchievements.push(achievement);
    }
  }

  return newAchievements;
}

// ---------------------------------------------------------------------------
// Get all achievements for a user
// ---------------------------------------------------------------------------

/**
 * Retrieve all achievements for a user, sorted by earnedAt descending.
 *
 * @param userId - The user whose achievements to retrieve
 * @returns Array of AchievementLocal records sorted by most recent first
 */
export async function getAchievements(
  userId: string,
): Promise<AchievementLocal[]> {
  const db = await getDB();

  const achievements = await db.getAllFromIndex(
    'achievements',
    'by-userId',
    userId,
  );

  // Sort by earnedAt descending (most recent first)
  achievements.sort((a, b) => b.earnedAt.localeCompare(a.earnedAt));

  return achievements;
}
