/**
 * ForageFlow — Data Export Utility
 *
 * Generates a JSON export of all user data from IndexedDB.
 * Excludes photo blobs (too large) but includes metadata.
 *
 * Requirements: 23.1, 23.2, 23.3
 */

import { getAllRecords } from '@/offline/db';
import type {
  JournalEntry,
  HarvestEntry,
  MicrohabitatPinRecord,
  CheckInRecord,
  ForagingProfile,
  OutingInvitation,
  Trip,
  ExpeditionLog,
} from '@/types';

/**
 * Exported data structure.
 */
export interface UserDataExport {
  exportedAt: string;
  userId: string;
  version: string;
  data: {
    journalEntries: JournalEntry[];
    harvestEntries: HarvestEntry[];
    microhabitatPins: MicrohabitatPinRecord[];
    checkIns: CheckInRecord[];
    foragingProfile: ForagingProfile | null;
    outingInvitations: OutingInvitation[];
    trips: Trip[];
    expeditionLogs: ExpeditionLog[];
  };
}

/**
 * Generates a complete JSON export of all user data.
 * Excludes photo blobs but includes all metadata.
 *
 * @param userId - The user whose data to export
 * @returns A UserDataExport object ready for JSON serialization
 */
export async function generateDataExport(userId: string): Promise<UserDataExport> {
  // Fetch all user-generated data from IndexedDB
  const [
    journalEntries,
    harvestEntries,
    microhabitatPins,
    checkIns,
    foragingProfiles,
    outingInvitations,
    trips,
    expeditionLogs,
  ] = await Promise.all([
    getAllRecords('journalEntries'),
    getAllRecords('harvestEntries'),
    getAllRecords('microhabitatPins'),
    getAllRecords('checkIns'),
    getAllRecords('foragingProfiles'),
    getAllRecords('outingInvitations'),
    getAllRecords('trips'),
    getAllRecords('expeditionLogs'),
  ]);

  // Filter to current user's data
  const userJournal = (journalEntries as JournalEntry[]).filter((e) => e.userId === userId);
  const userHarvests = (harvestEntries as HarvestEntry[]).filter((e) => e.userId === userId);
  const userPins = (microhabitatPins as MicrohabitatPinRecord[]).filter((e) => e.userId === userId);
  const userCheckIns = (checkIns as CheckInRecord[]).filter((e) => e.userId === userId);
  const userProfile = (foragingProfiles as ForagingProfile[]).find((p) => p.userId === userId) ?? null;
  const userInvitations = (outingInvitations as OutingInvitation[]).filter(
    (i) => i.fromUserId === userId || i.toUserId === userId,
  );
  const userTrips = (trips as Trip[]).filter((t) => t.userId === userId);
  const userLogs = (expeditionLogs as ExpeditionLog[]).filter((l) => l.userId === userId);

  // Strip photo blobs from expedition logs (include metadata only)
  const logsWithoutBlobs = userLogs.map((log) => ({
    ...log,
    photos: log.photos.map((p) => `[photo-reference: ${p}]`),
  }));

  return {
    exportedAt: new Date().toISOString(),
    userId,
    version: '1.0.0',
    data: {
      journalEntries: userJournal,
      harvestEntries: userHarvests,
      microhabitatPins: userPins,
      checkIns: userCheckIns,
      foragingProfile: userProfile,
      outingInvitations: userInvitations,
      trips: userTrips,
      expeditionLogs: logsWithoutBlobs,
    },
  };
}

/**
 * Downloads the export as a JSON file in the browser.
 */
export function downloadExportAsFile(exportData: UserDataExport): void {
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `forageflow-export-${exportData.exportedAt.split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
