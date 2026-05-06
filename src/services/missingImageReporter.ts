/**
 * ForageWise — Missing Image Reporter
 *
 * Tracks images that fail to load and stores reports in IndexedDB
 * for the admin dashboard to display.
 */

import { putRecord, getAllRecords } from '@/offline/db';

export interface MissingImageReport {
  id: string;
  src: string;
  context: string; // e.g. "species detail", "park card", etc.
  reportedAt: string;
}

/**
 * Report a missing image. Stores in the settings store with a known prefix.
 */
export async function reportMissingImage(src: string, context: string): Promise<void> {
  try {
    const id = `missing-image-${src.replace(/[^a-zA-Z0-9-]/g, '_')}`;
    await putRecord('settings', {
      id,
      theme: 'light',
      safetyDisclaimerDismissed: false,
      introAnimationShown: false,
      lastSyncAt: new Date().toISOString(),
      _missingImage: JSON.stringify({
        src,
        context,
        reportedAt: new Date().toISOString(),
      }),
    });
  } catch {
    // Silently fail — this is a non-critical reporting feature
  }
}

/**
 * Get all missing image reports from IndexedDB.
 */
export async function getMissingImageReports(): Promise<MissingImageReport[]> {
  try {
    const allSettings = await getAllRecords('settings');
    const reports: MissingImageReport[] = [];

    for (const setting of allSettings) {
      const raw = (setting as Record<string, unknown>)._missingImage;
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          reports.push({
            id: setting.id,
            src: parsed.src,
            context: parsed.context,
            reportedAt: parsed.reportedAt,
          });
        } catch {
          // Skip malformed entries
        }
      }
    }

    return reports.sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
  } catch {
    return [];
  }
}
