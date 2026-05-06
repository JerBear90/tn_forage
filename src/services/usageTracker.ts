/**
 * ForageWise — Usage Tracker
 *
 * Tracks feature usage for monetization gating and analytics.
 * Stores daily counts in localStorage for offline-first operation.
 * Syncs to PocketBase when online.
 */

const USAGE_KEY = 'fw_usage_tracking';

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  aiIdentifications: number;
  mapDownloads: number;
  communityPosts: number;
  tripsCreated: number;
  speciesViewed: number;
  searchesPerformed: number;
}

interface UsageStore {
  daily: Record<string, DailyUsage>;
  lifetime: {
    totalAiIds: number;
    totalTrips: number;
    totalPosts: number;
    firstUsedAt: string;
    lastUsedAt: string;
    totalSessions: number;
  };
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getStore(): UsageStore {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* use default */ }
  return {
    daily: {},
    lifetime: {
      totalAiIds: 0,
      totalTrips: 0,
      totalPosts: 0,
      firstUsedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      totalSessions: 0,
    },
  };
}

function saveStore(store: UsageStore): void {
  try {
    store.lifetime.lastUsedAt = new Date().toISOString();
    localStorage.setItem(USAGE_KEY, JSON.stringify(store));
  } catch { /* storage full */ }
}

function getTodayUsage(store: UsageStore): DailyUsage {
  const today = getToday();
  if (!store.daily[today]) {
    store.daily[today] = {
      date: today,
      aiIdentifications: 0,
      mapDownloads: 0,
      communityPosts: 0,
      tripsCreated: 0,
      speciesViewed: 0,
      searchesPerformed: 0,
    };
  }
  return store.daily[today];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Track an AI identification attempt */
export function trackAiIdentification(): void {
  const store = getStore();
  const today = getTodayUsage(store);
  today.aiIdentifications++;
  store.lifetime.totalAiIds++;
  saveStore(store);
}

/** Get today's AI identification count */
export function getAiIdCountToday(): number {
  const store = getStore();
  const today = getToday();
  return store.daily[today]?.aiIdentifications ?? 0;
}

/** Check if user has exceeded free AI ID limit */
export function hasExceededAiLimit(freeLimit: number = 3): boolean {
  return getAiIdCountToday() >= freeLimit;
}

/** Track a map download */
export function trackMapDownload(): void {
  const store = getStore();
  const today = getTodayUsage(store);
  today.mapDownloads++;
  saveStore(store);
}

/** Track a community post */
export function trackCommunityPost(): void {
  const store = getStore();
  const today = getTodayUsage(store);
  today.communityPosts++;
  store.lifetime.totalPosts++;
  saveStore(store);
}

/** Track a trip creation */
export function trackTripCreated(): void {
  const store = getStore();
  const today = getTodayUsage(store);
  today.tripsCreated++;
  store.lifetime.totalTrips++;
  saveStore(store);
}

/** Track a species page view */
export function trackSpeciesView(): void {
  const store = getStore();
  const today = getTodayUsage(store);
  today.speciesViewed++;
  saveStore(store);
}

/** Track a search */
export function trackSearch(): void {
  const store = getStore();
  const today = getTodayUsage(store);
  today.searchesPerformed++;
  saveStore(store);
}

/** Track a new session */
export function trackSession(): void {
  const store = getStore();
  store.lifetime.totalSessions++;
  saveStore(store);
}

/** Get full usage data (for admin dashboard) */
export function getUsageData(): UsageStore {
  return getStore();
}

/** Get usage for the last N days */
export function getRecentUsage(days: number = 7): DailyUsage[] {
  const store = getStore();
  const result: DailyUsage[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    result.push(store.daily[key] ?? {
      date: key,
      aiIdentifications: 0,
      mapDownloads: 0,
      communityPosts: 0,
      tripsCreated: 0,
      speciesViewed: 0,
      searchesPerformed: 0,
    });
  }

  return result.reverse();
}

/** Clean up usage data older than 90 days */
export function pruneOldUsage(): void {
  const store = getStore();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  for (const key of Object.keys(store.daily)) {
    if (key < cutoffStr) {
      delete store.daily[key];
    }
  }
  saveStore(store);
}
