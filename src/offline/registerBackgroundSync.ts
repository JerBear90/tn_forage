/**
 * ForageFlow — Background Sync Registration
 *
 * Registers a Background Sync event with the service worker so that
 * pending sync queue items are processed even when the app is closed.
 *
 * Falls back gracefully when:
 * - Service Worker is not available
 * - Background Sync API is not supported
 * - Registration fails for any reason
 */

/**
 * Request the service worker to process the sync queue when connectivity
 * is restored. Call this after enqueuing a new item.
 */
export async function requestBackgroundSync(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready;

    if ('sync' in registration) {
      await (registration as any).sync.register('forageflow-sync-queue');
    }
  } catch {
    // Background Sync not supported or registration failed — silent fallback
    // The useAutoSync hook will handle sync when the app is open
  }
}
