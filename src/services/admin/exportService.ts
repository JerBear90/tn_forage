/**
 * Export service for the admin dashboard.
 *
 * Generates JSON and CSV exports of analytics data (page views, sessions,
 * errors, feedback) for a selected time range. Supports opt-out disclaimer
 * inclusion, chunked Blob construction for large exports, and a 30-second
 * timeout with partial export fallback.
 *
 * @module exportService
 */

import { pb } from '@/auth/authService';
import type {
  ExportOptions,
  ExportResult,
  TimeRange,
} from '@/types/admin-dashboard';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum export generation time before triggering partial export (ms). */
const EXPORT_TIMEOUT_MS = 30_000;

/** Chunk size threshold for large Blob construction (10 MB). */
const LARGE_EXPORT_THRESHOLD = 10 * 1024 * 1024;

/** Opt-out disclaimer text appended to exports when enabled. */
const OPT_OUT_DISCLAIMER =
  'Note: Some users have opted out of analytics tracking. ' +
  'Metrics in this export may be undercounted as opted-out users are excluded ' +
  'from page view and usage event data. Error logs for opted-out users are ' +
  'included but without personally identifiable information.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a PocketBase filter string for records within a time range.
 */
function timeRangeFilter(timeRange: TimeRange, field: string = 'timestamp'): string {
  const start = timeRange.startDate.toISOString().replace('T', ' ');
  const end = timeRange.endDate.toISOString().replace('T', ' ');
  return `${field} >= "${start}" && ${field} <= "${end}"`;
}

/**
 * Generates a filename for the export based on format and timestamp.
 */
function generateFilename(format: 'json' | 'csv'): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '-');
  return `foragewise-export-${dateStr}_${timeStr}.${format}`;
}

/**
 * Converts an array of objects to CSV string.
 * Handles nested objects by JSON-stringifying them.
 */
function objectsToCsv(data: Record<string, unknown>[], sectionLabel?: string): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const lines: string[] = [];

  if (sectionLabel) {
    lines.push(`# ${sectionLabel}`);
  }

  // Header row
  lines.push(headers.map(escapeCsvField).join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return escapeCsvField(JSON.stringify(val));
      return escapeCsvField(String(val));
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * Escapes a CSV field value, wrapping in quotes if it contains
 * commas, quotes, or newlines.
 */
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Data Fetching
// ---------------------------------------------------------------------------

interface FetchContext {
  aborted: boolean;
}

/**
 * Fetches page view records for the given time range.
 */
async function fetchPageViews(
  timeRange: TimeRange,
  ctx: FetchContext,
): Promise<Record<string, unknown>[]> {
  if (ctx.aborted) return [];
  const filter = timeRangeFilter(timeRange);
  const records = await pb.collection('analytics_page_views').getFullList({
    filter,
    sort: 'timestamp',
  });
  return records.map((r) => ({
    id: r.id,
    path: r.path,
    timestamp: r.timestamp,
    sessionId: r.sessionId,
    userId: r.userId ?? null,
  }));
}

/**
 * Fetches session records for the given time range.
 */
async function fetchSessions(
  timeRange: TimeRange,
  ctx: FetchContext,
): Promise<Record<string, unknown>[]> {
  if (ctx.aborted) return [];
  const filter = timeRangeFilter(timeRange, 'startedAt');
  const records = await pb.collection('analytics_sessions').getFullList({
    filter,
    sort: 'startedAt',
  });
  return records.map((r) => ({
    id: r.id,
    sessionId: r.sessionId,
    userId: r.userId ?? null,
    startedAt: r.startedAt,
    endedAt: r.endedAt,
    duration: r.duration,
    pageCount: r.pageCount,
  }));
}

/**
 * Fetches error log records for the given time range.
 */
async function fetchErrors(
  timeRange: TimeRange,
  ctx: FetchContext,
): Promise<Record<string, unknown>[]> {
  if (ctx.aborted) return [];
  const filter = timeRangeFilter(timeRange);
  const records = await pb.collection('analytics_errors').getFullList({
    filter,
    sort: '-timestamp',
  });
  return records.map((r) => ({
    id: r.id,
    message: r.message,
    stack: r.stack,
    pageUrl: r.pageUrl,
    timestamp: r.timestamp,
    browser: r.browser,
    userId: r.userId ?? null,
    resolved: r.resolved ?? false,
  }));
}

/**
 * Fetches feedback records for the given time range.
 */
async function fetchFeedback(
  timeRange: TimeRange,
  ctx: FetchContext,
): Promise<Record<string, unknown>[]> {
  if (ctx.aborted) return [];
  const filter = timeRangeFilter(timeRange);
  const records = await pb.collection('analytics_feedback').getFullList({
    filter,
    sort: '-timestamp',
  });
  return records.map((r) => ({
    id: r.id,
    rating: r.rating,
    message: r.message ?? '',
    pageUrl: r.pageUrl,
    timestamp: r.timestamp,
    userId: r.userId ?? null,
    deviceInfo: r.deviceInfo ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Export Generation
// ---------------------------------------------------------------------------

/** Section fetcher mapping */
const SECTION_FETCHERS: Record<
  string,
  (timeRange: TimeRange, ctx: FetchContext) => Promise<Record<string, unknown>[]>
> = {
  pageViews: fetchPageViews,
  sessions: fetchSessions,
  errors: fetchErrors,
  feedback: fetchFeedback,
};

/**
 * Generates a JSON export from the collected section data.
 */
function generateJsonExport(
  sectionData: Record<string, Record<string, unknown>[]>,
  includeDisclaimer: boolean,
): string {
  const exportPayload: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    ...sectionData,
  };

  if (includeDisclaimer) {
    exportPayload.disclaimer = OPT_OUT_DISCLAIMER;
  }

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Generates a CSV export from the collected section data.
 * Each section is separated by a blank line and prefixed with a section header.
 */
function generateCsvExport(
  sectionData: Record<string, Record<string, unknown>[]>,
  includeDisclaimer: boolean,
): string {
  const parts: string[] = [];

  if (includeDisclaimer) {
    parts.push(`# Disclaimer: ${OPT_OUT_DISCLAIMER}`);
    parts.push('');
  }

  parts.push(`# Exported at: ${new Date().toISOString()}`);
  parts.push('');

  for (const [section, data] of Object.entries(sectionData)) {
    if (data.length > 0) {
      parts.push(objectsToCsv(data, section));
      parts.push('');
    }
  }

  return parts.join('\n');
}

/**
 * Creates a Blob from content, using chunked construction for large payloads.
 */
function createExportBlob(content: string, mimeType: string): Blob {
  if (content.length > LARGE_EXPORT_THRESHOLD) {
    // Chunked Blob construction for large exports
    const chunkSize = 1024 * 1024; // 1 MB chunks
    const chunks: string[] = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }
    return new Blob(chunks, { type: mimeType });
  }

  return new Blob([content], { type: mimeType });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Main export function. Fetches data from PocketBase collections based on
 * the provided options, generates JSON or CSV output, and returns an
 * ExportResult with the Blob, filename, and record count.
 *
 * Features:
 * - Fetches only the requested sections (pageViews, sessions, errors, feedback)
 * - Applies time range filtering
 * - Includes opt-out disclaimer when requested
 * - 30-second timeout with partial export (returns whatever data was fetched)
 * - Chunked Blob construction for exports exceeding 10 MB
 *
 * @param options - Export configuration options
 * @returns ExportResult with blob, filename, and recordCount
 */
export async function exportData(options: ExportOptions): Promise<ExportResult> {
  const { format, timeRange, sections, includeOptOutDisclaimer } = options;

  const ctx: FetchContext = { aborted: false };
  const sectionData: Record<string, Record<string, unknown>[]> = {};
  let totalRecords = 0;

  // Set up timeout
  const timeoutPromise = new Promise<'timeout'>((resolve) => {
    setTimeout(() => {
      ctx.aborted = true;
      resolve('timeout');
    }, EXPORT_TIMEOUT_MS);
  });

  // Fetch each section sequentially (allows partial export on timeout)
  const fetchPromise = (async () => {
    for (const section of sections) {
      if (ctx.aborted) break;

      const fetcher = SECTION_FETCHERS[section];
      if (fetcher) {
        const data = await fetcher(timeRange, ctx);
        sectionData[section] = data;
        totalRecords += data.length;
      }
    }
    return 'complete' as const;
  })();

  // Race between fetch completion and timeout
  await Promise.race([fetchPromise, timeoutPromise]);

  // Generate output in the requested format
  const mimeType = format === 'json' ? 'application/json' : 'text/csv';
  let content: string;

  if (format === 'json') {
    content = generateJsonExport(sectionData, includeOptOutDisclaimer);
  } else {
    content = generateCsvExport(sectionData, includeOptOutDisclaimer);
  }

  const blob = createExportBlob(content, mimeType);
  const filename = generateFilename(format);

  return {
    blob,
    filename,
    recordCount: totalRecords,
  };
}
