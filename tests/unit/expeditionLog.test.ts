/**
 * Unit tests for Expedition Log functionality.
 *
 * Validates that expedition logs and photos can be created and persisted
 * to IndexedDB with the correct shape, including all required fields:
 * photos, coordinates, speciesGuess, notes, habitat, treeNearby,
 * visibility, syncStatus, and createdAt.
 *
 * Uses fake-indexeddb to provide an in-memory IndexedDB implementation.
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';

import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error — Node webcrypto is compatible enough for our usage
  globalThis.crypto = webcrypto;
}

import type { ExpeditionLog, Photo } from '@/types';
import { getDB, putRecord, getRecord, getAllRecords } from '@/offline/db';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLog(overrides: Partial<ExpeditionLog> = {}): ExpeditionLog {
  return {
    id: crypto.randomUUID(),
    userId: 'local-user',
    tripId: '',
    photos: [],
    coordinates: { lat: 36.0626, lng: -86.6816 },
    speciesGuess: 'Chanterelle',
    notes: 'Found near fallen oak',
    habitat: 'Moist leaf litter',
    treeNearby: 'Oak',
    visibility: 'private',
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makePhoto(overrides: Partial<Photo> = {}): Photo {
  return {
    id: crypto.randomUUID(),
    expeditionLogId: 'log-1',
    blob: new Blob(['fake-image-data'], { type: 'image/jpeg' }),
    mimeType: 'image/jpeg',
    caption: 'Top view',
    coordinates: { lat: 36.0626, lng: -86.6816 },
    createdAt: new Date().toISOString(),
    syncStatus: 'pending',
    ...overrides,
  };
}

async function clearStores() {
  const db = await getDB();
  await db.clear('expeditionLogs');
  await db.clear('photos');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await clearStores();
});

describe('ExpeditionLog persistence', () => {
  it('saves a log entry to IndexedDB and retrieves it', async () => {
    const log = makeLog();
    await putRecord('expeditionLogs', log);

    const saved = await getRecord('expeditionLogs', log.id);
    expect(saved).toBeDefined();
    expect(saved!.id).toBe(log.id);
    expect(saved!.userId).toBe('local-user');
    expect(saved!.speciesGuess).toBe('Chanterelle');
    expect(saved!.notes).toBe('Found near fallen oak');
    expect(saved!.habitat).toBe('Moist leaf litter');
    expect(saved!.treeNearby).toBe('Oak');
    expect(saved!.visibility).toBe('private');
    expect(saved!.syncStatus).toBe('pending');
    expect(saved!.createdAt).toBe(log.createdAt);
  });

  it('defaults visibility to private', async () => {
    const log = makeLog({ visibility: 'private' });
    await putRecord('expeditionLogs', log);

    const saved = await getRecord('expeditionLogs', log.id);
    expect(saved!.visibility).toBe('private');
  });

  it('saves a public log entry', async () => {
    const log = makeLog({ visibility: 'public' });
    await putRecord('expeditionLogs', log);

    const saved = await getRecord('expeditionLogs', log.id);
    expect(saved!.visibility).toBe('public');
  });

  it('saves coordinates from GPS', async () => {
    const log = makeLog({ coordinates: { lat: 35.9606, lng: -83.9207 } });
    await putRecord('expeditionLogs', log);

    const saved = await getRecord('expeditionLogs', log.id);
    expect(saved!.coordinates).toEqual({ lat: 35.9606, lng: -83.9207 });
  });

  it('saves a log without coordinates (manual location mode)', async () => {
    const log = makeLog({ coordinates: undefined });
    await putRecord('expeditionLogs', log);

    const saved = await getRecord('expeditionLogs', log.id);
    expect(saved!.coordinates).toBeUndefined();
  });

  it('saves a log with empty optional fields', async () => {
    const log = makeLog({
      speciesGuess: undefined,
      habitat: undefined,
      treeNearby: undefined,
      notes: '',
      tripId: '',
    });
    await putRecord('expeditionLogs', log);

    const saved = await getRecord('expeditionLogs', log.id);
    expect(saved!.speciesGuess).toBeUndefined();
    expect(saved!.habitat).toBeUndefined();
    expect(saved!.treeNearby).toBeUndefined();
    expect(saved!.notes).toBe('');
    expect(saved!.tripId).toBe('');
  });

  it('associates a log with a trip', async () => {
    const tripId = crypto.randomUUID();
    const log = makeLog({ tripId });
    await putRecord('expeditionLogs', log);

    const saved = await getRecord('expeditionLogs', log.id);
    expect(saved!.tripId).toBe(tripId);
  });

  it('always saves with syncStatus pending', async () => {
    const log = makeLog({ syncStatus: 'pending' });
    await putRecord('expeditionLogs', log);

    const saved = await getRecord('expeditionLogs', log.id);
    expect(saved!.syncStatus).toBe('pending');
  });

  it('stores multiple logs and retrieves all', async () => {
    const log1 = makeLog();
    const log2 = makeLog();
    const log3 = makeLog();

    await putRecord('expeditionLogs', log1);
    await putRecord('expeditionLogs', log2);
    await putRecord('expeditionLogs', log3);

    const all = await getAllRecords('expeditionLogs');
    expect(all).toHaveLength(3);
  });

  it('generates unique IDs for each log', async () => {
    const log1 = makeLog();
    const log2 = makeLog();
    expect(log1.id).not.toBe(log2.id);
  });

  it('saves all tree nearby options', async () => {
    const trees = ['Oak', 'Hickory', 'Elm', 'Maple', 'Pine', 'Poplar', 'Unknown'];
    for (const tree of trees) {
      const log = makeLog({ treeNearby: tree });
      await putRecord('expeditionLogs', log);
      const saved = await getRecord('expeditionLogs', log.id);
      expect(saved!.treeNearby).toBe(tree);
    }
  });
});

describe('Photo persistence', () => {
  it('saves a photo blob to IndexedDB and retrieves it', async () => {
    const photo = makePhoto();
    await putRecord('photos', photo);

    const saved = await getRecord('photos', photo.id);
    expect(saved).toBeDefined();
    expect(saved!.id).toBe(photo.id);
    expect(saved!.expeditionLogId).toBe('log-1');
    expect(saved!.mimeType).toBe('image/jpeg');
    expect(saved!.caption).toBe('Top view');
    expect(saved!.syncStatus).toBe('pending');
    expect(saved!.blob).toBeInstanceOf(Blob);
  });

  it('saves a photo without caption', async () => {
    const photo = makePhoto({ caption: undefined });
    await putRecord('photos', photo);

    const saved = await getRecord('photos', photo.id);
    expect(saved!.caption).toBeUndefined();
  });

  it('saves a photo with coordinates', async () => {
    const photo = makePhoto({ coordinates: { lat: 36.0, lng: -86.5 } });
    await putRecord('photos', photo);

    const saved = await getRecord('photos', photo.id);
    expect(saved!.coordinates).toEqual({ lat: 36.0, lng: -86.5 });
  });

  it('links photos to an expedition log via expeditionLogId', async () => {
    const logId = crypto.randomUUID();
    const photo1 = makePhoto({ expeditionLogId: logId });
    const photo2 = makePhoto({ expeditionLogId: logId });

    await putRecord('photos', photo1);
    await putRecord('photos', photo2);

    const all = await getAllRecords('photos');
    const linked = all.filter((p) => p.expeditionLogId === logId);
    expect(linked).toHaveLength(2);
  });

  it('stores multiple photos and retrieves all', async () => {
    await putRecord('photos', makePhoto());
    await putRecord('photos', makePhoto());
    await putRecord('photos', makePhoto());

    const all = await getAllRecords('photos');
    expect(all).toHaveLength(3);
  });
});

describe('Expedition log + photo integration', () => {
  it('saves a log with photo references and retrieves both', async () => {
    const logId = crypto.randomUUID();
    const photo1 = makePhoto({ expeditionLogId: logId });
    const photo2 = makePhoto({ expeditionLogId: logId });

    await putRecord('photos', photo1);
    await putRecord('photos', photo2);

    const log = makeLog({
      id: logId,
      photos: [photo1.id, photo2.id],
    });
    await putRecord('expeditionLogs', log);

    const savedLog = await getRecord('expeditionLogs', logId);
    expect(savedLog!.photos).toEqual([photo1.id, photo2.id]);

    // Verify photos are retrievable
    const savedPhoto1 = await getRecord('photos', photo1.id);
    const savedPhoto2 = await getRecord('photos', photo2.id);
    expect(savedPhoto1!.expeditionLogId).toBe(logId);
    expect(savedPhoto2!.expeditionLogId).toBe(logId);
  });
});