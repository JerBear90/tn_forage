'use client';

import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/auth/authService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditEntry {
  id: string;
  timestamp: string;
  actionType: 'moderation' | 'notification' | 'config_change';
  actor: string;
  details: string;
}

const PER_PAGE = 20;

// ---------------------------------------------------------------------------
// Audit Log Page
// ---------------------------------------------------------------------------

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchAuditLog = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allEntries: AuditEntry[] = [];

      // Fetch moderation log entries
      try {
        const modResult = await pb.collection('admin_moderation_log').getList(1, 200, {
          sort: '-timestamp',
          expand: 'moderatorId',
        });

        for (const record of modResult.items) {
          const moderator = record.expand?.moderatorId;
          const actorName =
            (moderator as Record<string, unknown>)?.name ??
            (moderator as Record<string, unknown>)?.email ??
            'Unknown';

          allEntries.push({
            id: `mod_${record.id}`,
            timestamp: record.timestamp as string,
            actionType: 'moderation',
            actor: String(actorName),
            details: `${record.action} ${record.targetType} (${record.targetId})${record.reason ? ` — ${record.reason}` : ''}`,
          });
        }
      } catch {
        // Collection might not exist or be empty
      }

      // Fetch notification sends
      try {
        const notifResult = await pb.collection('admin_notifications').getList(1, 200, {
          sort: '-sentAt',
          expand: 'sentBy',
        });

        for (const record of notifResult.items) {
          const sender = record.expand?.sentBy;
          const actorName =
            (sender as Record<string, unknown>)?.name ??
            (sender as Record<string, unknown>)?.email ??
            'Unknown';

          allEntries.push({
            id: `notif_${record.id}`,
            timestamp: record.sentAt as string,
            actionType: 'notification',
            actor: String(actorName),
            details: `Sent "${record.title}" to ${record.targetType === 'all' ? 'all users' : `${record.targetType}: ${record.targetValue}`} (${record.recipientCount} recipients)`,
          });
        }
      } catch {
        // Collection might not exist or be empty
      }

      // Sort all entries by timestamp descending
      allEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Paginate client-side
      setTotalItems(allEntries.length);
      setTotalPages(Math.max(1, Math.ceil(allEntries.length / PER_PAGE)));

      const startIdx = (page - 1) * PER_PAGE;
      const pageEntries = allEntries.slice(startIdx, startIdx + PER_PAGE);
      setEntries(pageEntries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand">
          Audit Log
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View admin actions including moderation decisions and notification sends.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10">
        <table
          className="w-full text-sm text-left"
          role="table"
          aria-label="Audit log entries"
        >
          <thead>
            <tr className="border-b border-brand-charcoal/10 bg-brand-sand/30 dark:border-brand-sand/10 dark:bg-brand-charcoal/50">
              <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">
                Timestamp
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">
                Action Type
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">
                Actor
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  Loading audit log...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No audit log entries found.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-brand-charcoal/5 dark:border-brand-sand/5 hover:bg-brand-sand/50 dark:hover:bg-brand-charcoal/30"
                >
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatTimestamp(entry.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <ActionTypeBadge type={entry.actionType} />
                  </td>
                  <td className="px-4 py-3 text-brand-charcoal dark:text-brand-sand font-medium">
                    {entry.actor}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-md truncate">
                    {entry.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-between" aria-label="Audit log pagination">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages} ({totalItems} total entries)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-sand/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-sand/20 dark:text-brand-sand dark:hover:bg-brand-charcoal/50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Next page"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-sand/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-sand/20 dark:text-brand-sand dark:hover:bg-brand-charcoal/50"
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ActionTypeBadge({ type }: { type: AuditEntry['actionType'] }) {
  const styles: Record<AuditEntry['actionType'], string> = {
    moderation: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    notification: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    config_change: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  };

  const labels: Record<AuditEntry['actionType'], string> = {
    moderation: 'Moderation',
    notification: 'Notification',
    config_change: 'Config Change',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[type]}`}
    >
      {labels[type]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatTimestamp(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
