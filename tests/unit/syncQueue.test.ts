/**
 * Unit tests for src/offline/syncQueue.ts
 *
 * Uses fake-indexeddb to provide an in-memory IndexedDB implementation
 * so tests run in Node without a browser.
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';

// fake-indexeddb polyfills indexedDB but not crypto — provide stubs
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error — Node webcrypto is compatible enough for our usage
  globalThis.crypto = webcrypto;
}

import { getDB } from '@/offline/db';

import {
  enqueue,
  dequeue,
  markInProgress,
  markDone,
  markFailed,
  getPending,
  getFailed,
  getByCollection,
  clearDone,
  retryFailed,
  generatePayloadHash,
  type EnqueueInput,
} from '@/offline/syncQueue';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInput(overrides: Partial<EnqueueInput> = {}): EnqueueInput {
  return {
    userId: 'user-1',
    collection: 'trips',
    operation: 'create',
    payload: { name: 'Morning hike' },
    ...overrides,
  };
}

/**
 * Clear the syncQueue store between tests. This avoids the
 * deleteDatabase / connection lifecycle issues with fake-indexeddb.
 */
async function clearSyncQueue() {
  const db = await getDB();
  await db.clear('syncQueue');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await clearSyncQueue();
});

describe('generatePayloadHash', () => {
  it('returns a hex string', async () => {
    const hash = await generatePayloadHash({ a: 1 });
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns the same hash for identical payloads', async () => {
    const a = await generatePayloadHash({ x: 'hello' });
    const b = await generatePayloadHash({ x: 'hello' });
    expect(a).toBe(b);
  });

  it('returns different hashes for different payloads', async () => {
    const a = await generatePayloadHash({ x: 1 });
    const b = await generatePayloadHash({ x: 2 });
    expect(a).not.toBe(b);
  });
});

describe('enqueue', () => {
  it('creates a queue item with auto-generated fields', async () => {
    const item = await enqueue(makeInput());

    expect(item.localId).toBeTruthy();
    expect(item.userId).toBe('user-1');
    expect(item.collection).toBe('trips');
    expect(item.operation).toBe('create');
    expect(item.payload).toEqual({ name: 'Morning hike' });
    expect(item.syncStatus).toBe('pending');
    expect(item.retryCount).toBe(0);
    expect(item.clientVersion).toBe(1);
    expect(item.createdAt).toBeTruthy();
    expect(item.updatedAt).toBeTruthy();
    expect(item.payloadHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('persists the item in IndexedDB', async () => {
    const item = await enqueue(makeInput());
    const pending = await getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].localId).toBe(item.localId);
  });

  it('generates unique localIds for each enqueue', async () => {
    const a = await enqueue(makeInput());
    const b = await enqueue(makeInput());
    expect(a.localId).not.toBe(b.localId);
  });
});

describe('dequeue', () => {
  it('returns undefined when the queue is empty', async () => {
    const item = await dequeue();
    expect(item).toBeUndefined();
  });

  it('returns the oldest pending item', async () => {
    const first = await enqueue(makeInput({ payload: { order: 1 } }));
    await enqueue(makeInput({ payload: { order: 2 } }));

    const next = await dequeue();
    expect(next?.localId).toBe(first.localId);
  });

  it('skips non-pending items', async () => {
    const first = await enqueue(makeInput({ payload: { order: 1 } }));
    const second = await enqueue(makeInput({ payload: { order: 2 } }));

    await markInProgress(first.localId);

    const next = await dequeue();
    expect(next?.localId).toBe(second.localId);
  });
});

describe('markInProgress', () => {
  it('sets syncStatus to in-progress', async () => {
    const item = await enqueue(makeInput());
    await markInProgress(item.localId);

    const pending = await getPending();
    expect(pending).toHaveLength(0);

    const db = await getDB();
    const updated = await db.get('syncQueue', item.localId);
    expect(updated?.syncStatus).toBe('in-progress');
  });
});

describe('markDone', () => {
  it('sets syncStatus to done', async () => {
    const item = await enqueue(makeInput());
    await markDone(item.localId);

    const db = await getDB();
    const updated = await db.get('syncQueue', item.localId);
    expect(updated?.syncStatus).toBe('done');
  });

  it('stores serverId when provided', async () => {
    const item = await enqueue(makeInput());
    await markDone(item.localId, 'server-abc');

    const db = await getDB();
    const updated = await db.get('syncQueue', item.localId);
    expect(updated?.serverId).toBe('server-abc');
  });

  it('does not overwrite serverId when not provided', async () => {
    const item = await enqueue(makeInput({ serverId: 'original' }));
    await markDone(item.localId);

    const db = await getDB();
    const updated = await db.get('syncQueue', item.localId);
    expect(updated?.serverId).toBe('original');
  });
});

describe('markFailed', () => {
  it('sets syncStatus to failed and increments retryCount', async () => {
    const item = await enqueue(makeInput());
    await markFailed(item.localId);

    const db = await getDB();
    const updated = await db.get('syncQueue', item.localId);
    expect(updated?.syncStatus).toBe('failed');
    expect(updated?.retryCount).toBe(1);
  });

  it('increments retryCount on each failure', async () => {
    const item = await enqueue(makeInput());
    await markFailed(item.localId);
    await markFailed(item.localId);

    const db = await getDB();
    const updated = await db.get('syncQueue', item.localId);
    expect(updated?.retryCount).toBe(2);
  });
});

describe('getPending', () => {
  it('returns only pending items', async () => {
    await enqueue(makeInput({ payload: { a: 1 } }));
    const second = await enqueue(makeInput({ payload: { a: 2 } }));
    await markDone(second.localId);

    const pending = await getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].syncStatus).toBe('pending');
  });
});

describe('getFailed', () => {
  it('returns only failed items', async () => {
    const item = await enqueue(makeInput());
    await enqueue(makeInput({ payload: { other: true } }));
    await markFailed(item.localId);

    const failed = await getFailed();
    expect(failed).toHaveLength(1);
    expect(failed[0].localId).toBe(item.localId);
  });
});

describe('getByCollection', () => {
  it('returns items for the specified collection', async () => {
    await enqueue(makeInput({ collection: 'trips' }));
    await enqueue(makeInput({ collection: 'expeditionLogs' }));
    await enqueue(makeInput({ collection: 'trips' }));

    const trips = await getByCollection('trips');
    expect(trips).toHaveLength(2);
    trips.forEach((t) => expect(t.collection).toBe('trips'));
  });

  it('returns empty array for unknown collection', async () => {
    const result = await getByCollection('nonexistent');
    expect(result).toEqual([]);
  });
});

describe('clearDone', () => {
  it('removes all done items', async () => {
    const a = await enqueue(makeInput({ payload: { a: 1 } }));
    const b = await enqueue(makeInput({ payload: { a: 2 } }));
    await enqueue(makeInput({ payload: { a: 3 } }));

    await markDone(a.localId);
    await markDone(b.localId);

    await clearDone();

    const db = await getDB();
    const all = await db.getAll('syncQueue');
    expect(all).toHaveLength(1);
    expect(all[0].syncStatus).toBe('pending');
  });

  it('does nothing when no done items exist', async () => {
    await enqueue(makeInput());
    await clearDone();

    const pending = await getPending();
    expect(pending).toHaveLength(1);
  });
});

describe('retryFailed', () => {
  it('resets failed items under the retry limit back to pending', async () => {
    const item = await enqueue(makeInput());
    await markFailed(item.localId); // retryCount = 1

    const resetCount = await retryFailed(3);
    expect(resetCount).toBe(1);

    const pending = await getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].localId).toBe(item.localId);
    expect(pending[0].syncStatus).toBe('pending');
  });

  it('leaves items at or above the retry limit as failed', async () => {
    const item = await enqueue(makeInput());
    await markFailed(item.localId); // 1
    await markFailed(item.localId); // 2
    await markFailed(item.localId); // 3

    const resetCount = await retryFailed(3);
    expect(resetCount).toBe(0);

    const failed = await getFailed();
    expect(failed).toHaveLength(1);
  });

  it('defaults maxRetries to 3', async () => {
    const item = await enqueue(makeInput());
    await markFailed(item.localId); // 1
    await markFailed(item.localId); // 2

    const resetCount = await retryFailed();
    expect(resetCount).toBe(1);
  });
});
