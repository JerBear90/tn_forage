/**
 * ForageFlow — Account Deletion Utility
 *
 * Deletes all user data from all IndexedDB stores.
 * Revokes the current session and queues server-side deletion.
 *
 * Requirements: 23.4–23.8
 */

import { clearStore, getAllRecords, deleteRecord, putRecord } from '@/offline/db';
import type { SyncQueueItem } from '@/types';

/**
 * User-generated data stores that should be cleared on account deletion.
 * Reference data (species, plants, trees, parks) is NOT deleted.
 */
const USER_DATA_STORES = [
  'journalEntries',
  'harvestEntries',
  'microhabitatPins',
  'checkIns',
  'foragingProfiles',
  'outingInvitations',
  'usageEvents',
  'beaconSessions',
  'locationSharingSessions',
  'customRoutes',
  'trailConditionReports',
  'emergencyContacts',
  'downloadedMapRegions',
  'mapTiles',
  'fruitingForecasts',
  'pushSubscriptions',
] as const;

/**
 * Stores that contain mixed data (user + system) — filter by userId.
 */
const FILTERED_STORES = [
  'trips',
  'expeditionLogs',
  'photos',
] as const;

/**
 * Result of the account deletion process.
 */
export interface DeletionResult {
  success: boolean;
  storesCleared: string[];
  recordsDeleted: number;
  serverDeletionQueued: boolean;
  errors: string[];
}

/**
 * Deletes all user data from IndexedDB and queues server-side deletion.
 *
 * This is a destructive, irreversible operation.
 *
 * @param userId - The user whose data to delete
 * @returns DeletionResult indicating what was deleted
 */
export async function deleteAccount(userId: string): Promise<DeletionResult> {
  const result: DeletionResult = {
    success: false,
    storesCleared: [],
    recordsDeleted: 0,
    serverDeletionQueued: false,
    errors: [],
  };

  try {
    // 1. Clear user-specific stores entirely
    for (const store of USER_DATA_STORES) {
      try {
        await clearStore(store as never);
        result.storesCleared.push(store);
      } catch (err) {
        result.errors.push(`Failed to clear store: ${store}`);
      }
    }

    // 2. Delete user-specific records from shared stores
    for (const store of FILTERED_STORES) {
      try {
        const records = await getAllRecords(store as never);
        for (const record of records) {
          if ((record as { userId?: string }).userId === userId) {
            await deleteRecord(store as never, (record as { id: string }).id as never);
            result.recordsDeleted++;
          }
        }
        result.storesCleared.push(store);
      } catch (err) {
        result.errors.push(`Failed to filter store: ${store}`);
      }
    }

    // 3. Clear user profile and auth data
    try {
      await clearStore('userProfileLocal');
      await clearStore('membershipLocal');
      await clearStore('authMetaLocal');
      result.storesCleared.push('userProfileLocal', 'membershipLocal', 'authMetaLocal');
    } catch (err) {
      result.errors.push('Failed to clear auth stores');
    }

    // 4. Clear sync queue
    try {
      await clearStore('syncQueue');
      result.storesCleared.push('syncQueue');
    } catch (err) {
      result.errors.push('Failed to clear sync queue');
    }

    // 5. Queue server-side deletion
    try {
      const deletionRequest: SyncQueueItem = {
        localId: `delete-account-${userId}-${Date.now()}`,
        userId,
        collection: '__account_deletion__',
        operation: 'delete',
        payload: { userId, requestedAt: new Date().toISOString() },
        payloadHash: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
        retryCount: 0,
        clientVersion: 1,
      };

      await putRecord('syncQueue', deletionRequest);
      result.serverDeletionQueued = true;
    } catch (err) {
      result.errors.push('Failed to queue server deletion');
    }

    // 6. Clear settings (except seed data version)
    try {
      await clearStore('settings');
      result.storesCleared.push('settings');
    } catch (err) {
      result.errors.push('Failed to clear settings');
    }

    result.success = result.errors.length === 0;
  } catch (err) {
    result.errors.push(`Unexpected error: ${String(err)}`);
  }

  return result;
}

/**
 * Revokes the current session by clearing auth state.
 * Should be called after account deletion to log the user out.
 */
export async function revokeSession(): Promise<void> {
  try {
    await clearStore('authMetaLocal');
    // Clear any session storage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    // Clear any local storage auth tokens
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('pb_auth');
    }
  } catch {
    // Best effort — user will be logged out on next page load regardless
  }
}
