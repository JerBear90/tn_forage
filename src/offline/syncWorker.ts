/**
 * ForageFlow — Sync Worker
 *
 * Processes the offline sync queue by sending pending operations to PocketBase.
 * Runs when the device comes back online and processes items in FIFO order.
 *
 * This module is framework-agnostic — it can be called from a React hook,
 * a service worker, or directly.
 */

import PocketBase from 'pocketbase';
import {
  dequeue,
  markInProgress,
  markDone,
  markFailed,
  retryFailed,
  clearDone,
  getPending,
} from '@/offline/syncQueue';
import type { SyncQueueItem } from '@/types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const MAX_RETRIES = 3;
const BATCH_SIZE = 10;

// ---------------------------------------------------------------------------
// PocketBase Client (singleton for sync operations)
// ---------------------------------------------------------------------------

let pb: PocketBase | null = null;

function getPB(): PocketBase {
  if (!pb) {
    pb = new PocketBase(PB_URL);
  }
  return pb;
}

/**
 * Set the auth token on the PocketBase client for authenticated sync.
 * Call this before running processQueue if the user has a session.
 */
export function setSyncAuthToken(token: string): void {
  const client = getPB();
  client.authStore.save(token, null);
}

// ---------------------------------------------------------------------------
// Process a single queue item
// ---------------------------------------------------------------------------

/**
 * Execute a single sync queue item against PocketBase.
 *
 * @param item - The queue item to process
 * @returns The server-generated ID (for creates) or undefined
 */
async function processItem(item: SyncQueueItem): Promise<string | undefined> {
  const client = getPB();
  const { collection, operation, payload, serverId } = item;

  switch (operation) {
    case 'create': {
      const record = await client.collection(collection).create(payload as Record<string, unknown>);
      return record.id;
    }

    case 'update': {
      const id = serverId || (payload as Record<string, unknown>)?.id as string;
      if (!id) throw new Error(`No server ID for update on ${collection}`);
      await client.collection(collection).update(id, payload as Record<string, unknown>);
      return id;
    }

    case 'delete': {
      const id = serverId || (payload as Record<string, unknown>)?.id as string;
      if (!id) throw new Error(`No server ID for delete on ${collection}`);
      await client.collection(collection).delete(id);
      return undefined;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

// ---------------------------------------------------------------------------
// Process the queue
// ---------------------------------------------------------------------------

export interface SyncResult {
  processed: number;
  succeeded: number;
  failed: number;
  remaining: number;
}

/**
 * Process pending sync queue items in FIFO order.
 *
 * Processes up to BATCH_SIZE items per invocation to avoid blocking.
 * Items that fail are marked as failed with incremented retry count.
 * Items that exceed MAX_RETRIES remain in failed state.
 *
 * @returns Summary of the sync run
 */
export async function processQueue(): Promise<SyncResult> {
  // First, retry any previously failed items that haven't exceeded max retries
  await retryFailed(MAX_RETRIES);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  // Process items one at a time in FIFO order
  for (let i = 0; i < BATCH_SIZE; i++) {
    const item = await dequeue();
    if (!item) break; // No more pending items

    processed++;

    try {
      await markInProgress(item.localId);
      const serverId = await processItem(item);
      await markDone(item.localId, serverId);
      succeeded++;
    } catch (error) {
      await markFailed(item.localId);
      failed++;

      // Log for debugging (non-sensitive info only)
      console.warn(
        `[SyncWorker] Failed to sync ${item.collection}/${item.operation}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  // Clean up completed items
  await clearDone();

  // Count remaining
  const remaining = (await getPending()).length;

  return { processed, succeeded, failed, remaining };
}

/**
 * Check if there are pending items in the sync queue.
 */
export async function hasPendingSync(): Promise<boolean> {
  const pending = await getPending();
  return pending.length > 0;
}

/**
 * Get the count of pending sync items.
 */
export async function getPendingCount(): Promise<number> {
  const pending = await getPending();
  return pending.length;
}
