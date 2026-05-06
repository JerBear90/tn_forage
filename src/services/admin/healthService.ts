/**
 * System health monitoring service for the admin dashboard.
 *
 * Provides health checks for PocketBase connectivity, response time tracking,
 * IndexedDB sync queue depth, and Service Worker status. Aggregates all checks
 * into a single SystemHealthData object for the SystemHealthBar component.
 */

import { pb } from '@/auth/authService';
import { getDB } from '@/offline/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PocketBaseStatus = 'connected' | 'disconnected' | 'degraded';
export type ServiceWorkerStatus = 'active' | 'updating' | 'error' | 'none';

export interface PocketBaseHealthResult {
  status: PocketBaseStatus;
  responseTimeMs: number;
}

export interface SystemHealthData {
  pocketBase: PocketBaseHealthResult;
  lastHealthCheck: string; // ISO timestamp
  syncQueueDepth: number;
  serviceWorkerStatus: ServiceWorkerStatus;
  averageResponseTimeMs: number;
  hasError: boolean;
}

// ---------------------------------------------------------------------------
// Response time tracking (rolling window of last 10 calls)
// ---------------------------------------------------------------------------

const responseTimesBuffer: number[] = [];
const MAX_RESPONSE_TIMES = 10;

function trackResponseTime(ms: number): void {
  responseTimesBuffer.push(ms);
  if (responseTimesBuffer.length > MAX_RESPONSE_TIMES) {
    responseTimesBuffer.shift();
  }
}

function getAverageResponseTime(): number {
  if (responseTimesBuffer.length === 0) return 0;
  const sum = responseTimesBuffer.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / responseTimesBuffer.length);
}

// ---------------------------------------------------------------------------
// PocketBase Health Check
// ---------------------------------------------------------------------------

/**
 * Pings the PocketBase health endpoint and measures response time.
 *
 * Returns 'connected' if the health check succeeds within 2 seconds,
 * 'degraded' if it succeeds but takes longer than 2 seconds,
 * and 'disconnected' if it fails entirely.
 */
export async function checkPocketBaseHealth(): Promise<PocketBaseHealthResult> {
  const start = performance.now();

  try {
    await pb.health.check();
    const responseTimeMs = Math.round(performance.now() - start);
    trackResponseTime(responseTimeMs);

    // Degraded if response time exceeds 2000ms
    const status: PocketBaseStatus = responseTimeMs > 2000 ? 'degraded' : 'connected';

    return { status, responseTimeMs };
  } catch {
    const responseTimeMs = Math.round(performance.now() - start);
    return { status: 'disconnected', responseTimeMs };
  }
}

// ---------------------------------------------------------------------------
// IndexedDB Sync Queue Depth
// ---------------------------------------------------------------------------

/**
 * Checks the IndexedDB sync queue for pending records.
 *
 * Returns the count of items in the syncQueue store that have not yet
 * been synced to the server.
 */
export async function getSyncQueueDepth(): Promise<number> {
  try {
    const db = await getDB();
    return await db.count('syncQueue');
  } catch {
    return -1; // Indicates error reading IndexedDB
  }
}

// ---------------------------------------------------------------------------
// Service Worker Status
// ---------------------------------------------------------------------------

/**
 * Checks the Service Worker registration status.
 *
 * Returns:
 * - 'active' if a SW is registered and active
 * - 'updating' if a SW is installing or waiting
 * - 'error' if registration failed or SW is in an error state
 * - 'none' if no SW is registered or navigator.serviceWorker is unavailable
 */
export async function getServiceWorkerStatus(): Promise<ServiceWorkerStatus> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return 'none';
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
      return 'none';
    }

    if (registration.active) {
      // Check if there's also an installing/waiting worker (update in progress)
      if (registration.installing || registration.waiting) {
        return 'updating';
      }
      return 'active';
    }

    if (registration.installing || registration.waiting) {
      return 'updating';
    }

    return 'error';
  } catch {
    return 'error';
  }
}

// ---------------------------------------------------------------------------
// Aggregated System Health
// ---------------------------------------------------------------------------

/**
 * Aggregates all health checks into a single SystemHealthData object.
 *
 * Runs PocketBase health check, sync queue depth, and service worker status
 * checks in parallel for efficiency.
 */
export async function getSystemHealth(): Promise<SystemHealthData> {
  const [pocketBase, syncQueueDepth, serviceWorkerStatus] = await Promise.all([
    checkPocketBaseHealth(),
    getSyncQueueDepth(),
    getServiceWorkerStatus(),
  ]);

  const averageResponseTimeMs = getAverageResponseTime();
  const lastHealthCheck = new Date().toISOString();

  // Determine if any component is in error state
  const hasError =
    pocketBase.status === 'disconnected' ||
    serviceWorkerStatus === 'error' ||
    syncQueueDepth < 0;

  return {
    pocketBase,
    lastHealthCheck,
    syncQueueDepth,
    serviceWorkerStatus,
    averageResponseTimeMs,
    hasError,
  };
}
