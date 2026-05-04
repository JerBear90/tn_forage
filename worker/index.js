/**
 * ForageFlow — Custom Service Worker Extension
 *
 * Adds Background Sync support for the offline sync queue.
 * When the device comes back online, pending sync operations are
 * automatically processed without requiring the app to be open.
 *
 * This file is compiled into the generated service worker by next-pwa.
 */

// Register for Background Sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'forageflow-sync-queue') {
    event.waitUntil(processSyncQueue());
  }
});

// Also process on connectivity restore
self.addEventListener('online', () => {
  if (self.registration && self.registration.sync) {
    self.registration.sync.register('forageflow-sync-queue').catch(() => {
      processSyncQueue();
    });
  } else {
    processSyncQueue();
  }
});

/**
 * Process pending sync queue items by sending them to PocketBase.
 */
async function processSyncQueue() {
  try {
    const db = await openSyncDB();
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const index = store.index('by-syncStatus');

    const pendingItems = [];
    let cursor = await index.openCursor(IDBKeyRange.only('pending'));
    while (cursor) {
      pendingItems.push(cursor.value);
      cursor = await cursor.continue();
    }
    await tx.done;

    if (pendingItems.length === 0) return;

    pendingItems.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    const batch = pendingItems.slice(0, 10);
    const pbUrl = self.__POCKETBASE_URL || 'http://127.0.0.1:8090';

    for (const item of batch) {
      try {
        await updateItemStatus(db, item.localId, 'in-progress');
        await executeSyncItem(pbUrl, item);
        await updateItemStatus(db, item.localId, 'done');
      } catch (error) {
        await markItemFailed(db, item);
        console.warn('[SW Sync] Failed:', item.collection, error.message);
      }
    }

    await cleanupDoneItems(db);

    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage({ type: 'SYNC_COMPLETE', processed: batch.length });
    }
  } catch (error) {
    console.warn('[SW Sync] Queue processing failed:', error.message);
  }
}

async function executeSyncItem(pbUrl, item) {
  const { collection, operation, payload, serverId } = item;
  const url = `${pbUrl}/api/collections/${collection}/records`;

  switch (operation) {
    case 'create': {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      break;
    }
    case 'update': {
      const id = serverId || payload?.id;
      if (!id) throw new Error('No ID for update');
      const res = await fetch(`${url}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      break;
    }
    case 'delete': {
      const id = serverId || payload?.id;
      if (!id) throw new Error('No ID for delete');
      const res = await fetch(`${url}/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) throw new Error(`Delete failed: ${res.status}`);
      break;
    }
  }
}

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('forageflow', 3);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function updateItemStatus(db, localId, status) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const getReq = store.get(localId);
    getReq.onsuccess = () => {
      const item = getReq.result;
      if (!item) { resolve(); return; }
      item.syncStatus = status;
      item.updatedAt = new Date().toISOString();
      store.put(item);
      tx.oncomplete = () => resolve();
    };
    getReq.onerror = () => reject(getReq.error);
    tx.onerror = () => reject(tx.error);
  });
}

async function markItemFailed(db, item) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    item.syncStatus = 'failed';
    item.retryCount = (item.retryCount || 0) + 1;
    item.updatedAt = new Date().toISOString();
    const putReq = store.put(item);
    putReq.onsuccess = () => resolve();
    putReq.onerror = () => reject(putReq.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function cleanupDoneItems(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const index = store.index('by-syncStatus');
    const range = IDBKeyRange.only('done');
    const cursorReq = index.openCursor(range);
    cursorReq.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
