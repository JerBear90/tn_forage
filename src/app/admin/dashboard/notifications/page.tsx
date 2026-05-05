'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NotificationDraft, NotificationTarget, SentNotification } from '@/types/admin-dashboard';
import {
  sendNotification,
  checkDuplicate,
  getNotificationHistory,
} from '@/services/admin/notificationService';
import type { NotificationHistoryResult } from '@/services/admin/notificationService';

const PER_PAGE = 10;

export default function NotificationsPage() {
  // Composer state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'region' | 'role'>('all');
  const [targetValue, setTargetValue] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  // Confirmation dialog state
  const [showConfirm, setShowConfirm] = useState(false);

  // History state
  const [history, setHistory] = useState<NotificationHistoryResult | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Fetch notification history
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await getNotificationHistory(historyPage, PER_PAGE);
      setHistory(data);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Failed to load notification history');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Check for duplicates when title or body changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (title.trim() && body.trim()) {
        try {
          const isDuplicate = await checkDuplicate(title, body);
          setDuplicateWarning(isDuplicate);
        } catch {
          setDuplicateWarning(false);
        }
      } else {
        setDuplicateWarning(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [title, body]);

  const buildTarget = (): NotificationTarget => {
    switch (targetType) {
      case 'region':
        return { type: 'region', region: targetValue };
      case 'role':
        return { type: 'role', role: targetValue };
      default:
        return { type: 'all' };
    }
  };

  const handleSendClick = () => {
    setSendError(null);
    setSendSuccess(null);
    setShowConfirm(true);
  };

  const handleConfirmSend = async () => {
    setShowConfirm(false);
    setSending(true);
    setSendError(null);
    setSendSuccess(null);

    const draft: NotificationDraft = {
      title: title.trim(),
      body: body.trim(),
      linkUrl: linkUrl.trim() || undefined,
      target: buildTarget(),
    };

    try {
      const result = await sendNotification(draft);
      setSendSuccess(`Notification sent to ${result.recipientCount} recipient${result.recipientCount !== 1 ? 's' : ''}.`);
      // Reset form
      setTitle('');
      setBody('');
      setLinkUrl('');
      setTargetType('all');
      setTargetValue('');
      setDuplicateWarning(false);
      // Refresh history
      fetchHistory();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const isFormValid = title.trim().length > 0 && body.trim().length > 0 &&
    (targetType === 'all' || targetValue.trim().length > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand">
          Push Notifications
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Compose and broadcast push notifications to users
        </p>
      </div>

      {/* Notification Composer */}
      <section
        className="rounded-xl border border-brand-charcoal/10 bg-white p-6 shadow-sm dark:border-brand-sand/10 dark:bg-brand-charcoal/50"
        aria-labelledby="composer-heading"
      >
        <h2
          id="composer-heading"
          className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand"
        >
          Compose Notification
        </h2>

        <div className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="notification-title"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="notification-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              aria-label="Notification title"
              aria-required="true"
              className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500 dark:focus:border-brand-teal"
            />
          </div>

          {/* Body */}
          <div>
            <label
              htmlFor="notification-body"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              Body <span className="text-red-500">*</span>
            </label>
            <textarea
              id="notification-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification message body"
              aria-label="Notification body"
              aria-required="true"
              rows={4}
              className="mt-1 w-full min-h-[88px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-3 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500 dark:focus:border-brand-teal resize-y"
            />
          </div>

          {/* Link URL */}
          <div>
            <label
              htmlFor="notification-link"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              Link URL <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              id="notification-link"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com/page"
              aria-label="Optional link URL"
              className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500 dark:focus:border-brand-teal"
            />
          </div>

          {/* Target Selector */}
          <div>
            <label
              htmlFor="notification-target"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              Target Audience <span className="text-red-500">*</span>
            </label>
            <select
              id="notification-target"
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value as 'all' | 'region' | 'role');
                setTargetValue('');
              }}
              aria-label="Notification target audience"
              className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:focus:border-brand-teal"
            >
              <option value="all">All Users</option>
              <option value="region">By Region</option>
              <option value="role">By Role</option>
            </select>
          </div>

          {/* Target Value (region or role) */}
          {targetType === 'region' && (
            <div>
              <label
                htmlFor="notification-region"
                className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
              >
                Region <span className="text-red-500">*</span>
              </label>
              <input
                id="notification-region"
                type="text"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g., East Tennessee"
                aria-label="Target region"
                aria-required="true"
                className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500 dark:focus:border-brand-teal"
              />
            </div>
          )}

          {targetType === 'role' && (
            <div>
              <label
                htmlFor="notification-role"
                className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
              >
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="notification-role"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                aria-label="Target role"
                aria-required="true"
                className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:focus:border-brand-teal"
              >
                <option value="">Select a role</option>
                <option value="free">Free</option>
                <option value="member">Member</option>
                <option value="super_user">Super User</option>
              </select>
            </div>
          )}

          {/* Duplicate Warning */}
          {duplicateWarning && (
            <div
              className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
              role="alert"
              aria-live="polite"
            >
              ⚠️ A notification with the same title and body was sent within the last 5 minutes.
              Sending will be blocked until the cooldown expires.
            </div>
          )}

          {/* Send Error */}
          {sendError && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
              role="alert"
            >
              {sendError}
            </div>
          )}

          {/* Send Success */}
          {sendSuccess && (
            <div
              className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
              role="status"
            >
              ✓ {sendSuccess}
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSendClick}
            disabled={!isFormValid || sending || duplicateWarning}
            aria-label="Send notification"
            className="min-h-[44px] min-w-[44px] rounded-lg bg-brand-teal px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-teal/90 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </section>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <ConfirmationDialog
          title="Send Notification"
          message={`Are you sure you want to send this notification to ${targetType === 'all' ? 'all users' : targetType === 'region' ? `users in "${targetValue}"` : `users with role "${targetValue}"`}?`}
          onConfirm={handleConfirmSend}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Notification History */}
      <section aria-labelledby="history-heading">
        <h2
          id="history-heading"
          className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand"
        >
          Sent Notifications
        </h2>

        {historyError && (
          <div
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
            role="alert"
          >
            {historyError}
          </div>
        )}

        <div className="mt-4 overflow-x-auto rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10">
          <table
            className="w-full text-sm text-left"
            role="table"
            aria-label="Sent notification history"
          >
            <thead>
              <tr className="border-b border-brand-charcoal/10 bg-brand-sand/30 dark:border-brand-sand/10 dark:bg-brand-charcoal/50">
                <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">
                  Timestamp
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">
                  Title
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">
                  Target
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand text-center">
                  Recipients
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {historyLoading && !history ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Loading notification history...
                  </td>
                </tr>
              ) : history && history.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No notifications sent yet.
                  </td>
                </tr>
              ) : (
                history?.items.map((notification) => (
                  <tr
                    key={notification.id}
                    className="border-b border-brand-charcoal/5 dark:border-brand-sand/5 hover:bg-brand-sand/50 dark:hover:bg-brand-charcoal/30"
                  >
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(notification.sentAt)}
                    </td>
                    <td className="px-4 py-3 text-brand-charcoal dark:text-brand-sand font-medium">
                      {notification.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <TargetBadge target={notification.target} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-center">
                      {notification.recipientCount}
                    </td>
                    <td className="px-4 py-3">
                      <DeliveryStatusBadge status={notification.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {history && history.totalPages > 1 && (
          <nav className="mt-4 flex items-center justify-between" aria-label="Notification history pagination">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {historyPage} of {history.totalPages} ({history.totalItems} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                disabled={historyPage <= 1}
                aria-label="Previous page"
                className="min-h-[44px] min-w-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-sand/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-sand/20 dark:text-brand-sand dark:hover:bg-brand-charcoal/50"
              >
                Previous
              </button>
              <button
                onClick={() => setHistoryPage((p) => Math.min(history.totalPages, p + 1))}
                disabled={historyPage >= history.totalPages}
                aria-label="Next page"
                className="min-h-[44px] min-w-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-sand/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-sand/20 dark:text-brand-sand dark:hover:bg-brand-charcoal/50"
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TargetBadge({ target }: { target: NotificationTarget }) {
  let label = 'All Users';
  if (target.type === 'region') {
    label = `Region: ${target.region}`;
  } else if (target.type === 'role') {
    label = `Role: ${target.role}`;
  }

  return (
    <span className="inline-flex items-center rounded-full bg-brand-teal/10 px-2.5 py-0.5 text-xs font-medium text-brand-teal dark:bg-brand-teal/20 dark:text-brand-teal">
      {label}
    </span>
  );
}

function DeliveryStatusBadge({ status }: { status: SentNotification['status'] }) {
  const styles: Record<SentNotification['status'], string> = {
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ConfirmationDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-brand-charcoal">
        <h2
          id="confirm-dialog-title"
          className="text-lg font-bold text-brand-charcoal dark:text-brand-sand"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            aria-label="Cancel sending"
            className="min-h-[44px] min-w-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium text-brand-charcoal transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:text-brand-sand dark:hover:bg-brand-charcoal/50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            aria-label="Confirm send notification"
            className="min-h-[44px] min-w-[44px] rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-teal/90 focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}
