'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AnomalyAlert, AnomalyConfig } from '@/types/admin-dashboard';
import {
  getActiveAlerts,
  getAlertHistory,
  acknowledgeAlert,
  resolveAlert,
  getAlertConfig,
  updateAlertConfig,
  checkForAnomalies,
} from '@/services/admin/alertService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format an ISO timestamp into a human-readable string */
function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Get severity badge classes */
function severityBadgeClasses(severity: 'warning' | 'critical'): string {
  if (severity === 'critical') {
    return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  }
  return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
}

/** Get status badge classes */
function statusBadgeClasses(status: 'active' | 'acknowledged' | 'resolved'): string {
  switch (status) {
    case 'active':
      return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'acknowledged':
      return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'resolved':
      return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  }
}

/** Get anomaly type display label */
function typeLabel(type: string): string {
  switch (type) {
    case 'error_spike':
      return 'Error Spike';
    case 'traffic_drop':
      return 'Traffic Drop';
    case 'connection_failure':
      return 'Connection Failure';
    default:
      return type;
  }
}

// ---------------------------------------------------------------------------
// Alerts Page
// ---------------------------------------------------------------------------

export default function AlertsPage() {
  // Active alerts state
  const [activeAlerts, setActiveAlerts] = useState<AnomalyAlert[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);

  // Alert history state
  const [historyAlerts, setHistoryAlerts] = useState<AnomalyAlert[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Configuration state
  const [config, setConfig] = useState<AnomalyConfig>({
    errorSpikeMultiplier: 3,
    trafficDropThreshold: 0.5,
    connectionFailureMinutes: 5,
    emailRecipients: [],
  });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch active alerts
  const fetchActiveAlerts = useCallback(async () => {
    setLoadingActive(true);
    try {
      const alerts = await getActiveAlerts();
      setActiveAlerts(alerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load active alerts');
    } finally {
      setLoadingActive(false);
    }
  }, []);

  // Fetch alert history
  const fetchHistory = useCallback(async (page: number) => {
    setLoadingHistory(true);
    try {
      const result = await getAlertHistory(page, 10);
      setHistoryAlerts(result.items);
      setHistoryTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alert history');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Fetch configuration
  const fetchConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const cfg = await getAlertConfig();
      setConfig(cfg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alert configuration');
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchActiveAlerts();
    fetchHistory(1);
    fetchConfig();
  }, [fetchActiveAlerts, fetchHistory, fetchConfig]);

  // Handle acknowledge action
  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
      await fetchActiveAlerts();
      await fetchHistory(historyPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge alert');
    }
  };

  // Handle resolve action
  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
      await fetchActiveAlerts();
      await fetchHistory(historyPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve alert');
    }
  };

  // Handle check for anomalies
  const handleCheckAnomalies = async () => {
    try {
      await checkForAnomalies();
      await fetchActiveAlerts();
      await fetchHistory(historyPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check for anomalies');
    }
  };

  // Handle config save
  const handleSaveConfig = async () => {
    setSavingConfig(true);
    setConfigSaved(false);
    try {
      await updateAlertConfig(config);
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  // Handle adding email recipient
  const handleAddEmail = () => {
    const trimmed = emailInput.trim();
    if (trimmed && !config.emailRecipients.includes(trimmed)) {
      setConfig((prev) => ({
        ...prev,
        emailRecipients: [...prev.emailRecipients, trimmed],
      }));
      setEmailInput('');
    }
  };

  // Handle removing email recipient
  const handleRemoveEmail = (email: string) => {
    setConfig((prev) => ({
      ...prev,
      emailRecipients: prev.emailRecipients.filter((e) => e !== email),
    }));
  };

  // Handle history pagination
  const handlePageChange = (page: number) => {
    setHistoryPage(page);
    fetchHistory(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand">
            Anomaly Detection &amp; Alerts
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor anomalies, manage alerts, and configure detection thresholds
          </p>
        </div>
        <button
          onClick={handleCheckAnomalies}
          className="min-h-[44px] min-w-[44px] rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal/90 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          aria-label="Run anomaly detection check"
        >
          Check for Anomalies
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
          role="alert"
        >
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 min-h-[44px] min-w-[44px] text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Alerts Section */}
      <section aria-labelledby="active-alerts-heading">
        <div className="rounded-lg border border-brand-charcoal/10 bg-white p-6 shadow-sm dark:border-brand-sand/10 dark:bg-gray-800">
          <h2
            id="active-alerts-heading"
            className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand"
          >
            Active Alerts
          </h2>

          {loadingActive ? (
            <div className="mt-4 flex items-center justify-center py-8" aria-label="Loading active alerts">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-teal border-t-transparent" />
            </div>
          ) : activeAlerts.length === 0 ? (
            <div className="mt-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <p className="text-sm text-green-800 dark:text-green-300">
                No active anomalies detected. All systems operating normally.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex flex-col gap-3 rounded-lg border border-brand-charcoal/10 p-4 dark:border-brand-sand/10 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={severityBadgeClasses(alert.severity)}>
                        {alert.severity}
                      </span>
                      <span className={statusBadgeClasses(alert.status)}>
                        {alert.status}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {typeLabel(alert.type)}
                      </span>
                    </div>
                    <p className="text-sm text-brand-charcoal dark:text-brand-sand">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Detected: {formatTimestamp(alert.detectedAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {alert.status === 'active' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="min-h-[44px] min-w-[44px] rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 dark:hover:bg-yellow-900/40"
                        aria-label={`Acknowledge alert: ${alert.message}`}
                      >
                        Acknowledge
                      </button>
                    )}
                    {alert.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="min-h-[44px] min-w-[44px] rounded-md border border-green-300 bg-green-50 px-3 py-2 text-xs font-medium text-green-800 hover:bg-green-100 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40"
                        aria-label={`Resolve alert: ${alert.message}`}
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Alert History Section */}
      <section aria-labelledby="alert-history-heading">
        <div className="rounded-lg border border-brand-charcoal/10 bg-white p-6 shadow-sm dark:border-brand-sand/10 dark:bg-gray-800">
          <h2
            id="alert-history-heading"
            className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand"
          >
            Alert History
          </h2>

          {loadingHistory ? (
            <div className="mt-4 flex items-center justify-center py-8" aria-label="Loading alert history">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-teal border-t-transparent" />
            </div>
          ) : historyAlerts.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              No alert history available.
            </p>
          ) : (
            <>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm text-left" role="table" aria-label="Alert history table">
                  <thead>
                    <tr className="border-b border-brand-charcoal/10 dark:border-brand-sand/10">
                      <th scope="col" className="px-3 py-2 font-semibold text-brand-charcoal dark:text-brand-sand">
                        Type
                      </th>
                      <th scope="col" className="px-3 py-2 font-semibold text-brand-charcoal dark:text-brand-sand">
                        Severity
                      </th>
                      <th scope="col" className="px-3 py-2 font-semibold text-brand-charcoal dark:text-brand-sand">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-2 font-semibold text-brand-charcoal dark:text-brand-sand">
                        Message
                      </th>
                      <th scope="col" className="px-3 py-2 font-semibold text-brand-charcoal dark:text-brand-sand">
                        Detected
                      </th>
                      <th scope="col" className="px-3 py-2 font-semibold text-brand-charcoal dark:text-brand-sand">
                        Resolved
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyAlerts.map((alert) => (
                      <tr
                        key={alert.id}
                        className="border-b border-brand-charcoal/5 dark:border-brand-sand/5 hover:bg-brand-sand/50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-3 py-2 text-brand-charcoal dark:text-brand-sand whitespace-nowrap">
                          {typeLabel(alert.type)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={severityBadgeClasses(alert.severity)}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={statusBadgeClasses(alert.status)}>
                            {alert.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-brand-charcoal dark:text-brand-sand max-w-xs truncate">
                          {alert.message}
                        </td>
                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatTimestamp(alert.detectedAt)}
                        </td>
                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {alert.resolvedAt ? formatTimestamp(alert.resolvedAt) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {historyTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2" aria-label="Alert history pagination">
                  <button
                    onClick={() => handlePageChange(historyPage - 1)}
                    disabled={historyPage <= 1}
                    className="min-h-[44px] min-w-[44px] rounded-md border border-brand-charcoal/20 px-3 py-2 text-sm text-brand-charcoal hover:bg-brand-sand/50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-brand-sand/20 dark:text-brand-sand dark:hover:bg-gray-700/50"
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Page {historyPage} of {historyTotalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(historyPage + 1)}
                    disabled={historyPage >= historyTotalPages}
                    className="min-h-[44px] min-w-[44px] rounded-md border border-brand-charcoal/20 px-3 py-2 text-sm text-brand-charcoal hover:bg-brand-sand/50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-brand-sand/20 dark:text-brand-sand dark:hover:bg-gray-700/50"
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Configuration Section */}
      <section aria-labelledby="alert-config-heading">
        <div className="rounded-lg border border-brand-charcoal/10 bg-white p-6 shadow-sm dark:border-brand-sand/10 dark:bg-gray-800">
          <h2
            id="alert-config-heading"
            className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand"
          >
            Alert Configuration
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure anomaly detection thresholds and notification recipients
          </p>

          {loadingConfig ? (
            <div className="mt-4 flex items-center justify-center py-8" aria-label="Loading configuration">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-teal border-t-transparent" />
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Threshold Settings */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="errorSpikeMultiplier"
                    className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
                  >
                    Error Spike Multiplier
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Alert when errors exceed this multiple of the 7-day average
                  </p>
                  <input
                    id="errorSpikeMultiplier"
                    type="number"
                    min={1}
                    max={20}
                    step={0.5}
                    value={config.errorSpikeMultiplier}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        errorSpikeMultiplier: parseFloat(e.target.value) || 3,
                      }))
                    }
                    className="mt-1 block w-full min-h-[44px] rounded-md border border-brand-charcoal/20 bg-white px-3 py-2 text-sm text-brand-charcoal shadow-sm focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal dark:border-brand-sand/20 dark:bg-gray-700 dark:text-brand-sand"
                    aria-label="Error spike multiplier threshold"
                  />
                </div>

                <div>
                  <label
                    htmlFor="trafficDropThreshold"
                    className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
                  >
                    Traffic Drop Threshold
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Alert when active users fall below this fraction of the 7-day average
                  </p>
                  <input
                    id="trafficDropThreshold"
                    type="number"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={config.trafficDropThreshold}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        trafficDropThreshold: parseFloat(e.target.value) || 0.5,
                      }))
                    }
                    className="mt-1 block w-full min-h-[44px] rounded-md border border-brand-charcoal/20 bg-white px-3 py-2 text-sm text-brand-charcoal shadow-sm focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal dark:border-brand-sand/20 dark:bg-gray-700 dark:text-brand-sand"
                    aria-label="Traffic drop threshold"
                  />
                </div>

                <div>
                  <label
                    htmlFor="connectionFailureMinutes"
                    className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
                  >
                    Connection Failure Minutes
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Alert after PocketBase is unreachable for this many minutes
                  </p>
                  <input
                    id="connectionFailureMinutes"
                    type="number"
                    min={1}
                    max={60}
                    step={1}
                    value={config.connectionFailureMinutes}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        connectionFailureMinutes: parseInt(e.target.value, 10) || 5,
                      }))
                    }
                    className="mt-1 block w-full min-h-[44px] rounded-md border border-brand-charcoal/20 bg-white px-3 py-2 text-sm text-brand-charcoal shadow-sm focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal dark:border-brand-sand/20 dark:bg-gray-700 dark:text-brand-sand"
                    aria-label="Connection failure minutes threshold"
                  />
                </div>
              </div>

              {/* Email Recipients */}
              <div>
                <label
                  htmlFor="emailRecipient"
                  className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
                >
                  Email Recipients
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Email addresses to notify when critical alerts are triggered
                </p>

                {/* Current recipients */}
                {config.emailRecipients.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {config.emailRecipients.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-teal/10 px-3 py-1 text-xs text-brand-teal dark:bg-brand-teal/20"
                      >
                        {email}
                        <button
                          onClick={() => handleRemoveEmail(email)}
                          className="min-h-[24px] min-w-[24px] ml-1 rounded-full hover:bg-brand-teal/20 flex items-center justify-center"
                          aria-label={`Remove ${email} from recipients`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add email input */}
                <div className="flex gap-2">
                  <input
                    id="emailRecipient"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                    placeholder="admin@example.com"
                    className="block flex-1 min-h-[44px] rounded-md border border-brand-charcoal/20 bg-white px-3 py-2 text-sm text-brand-charcoal shadow-sm focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal dark:border-brand-sand/20 dark:bg-gray-700 dark:text-brand-sand dark:placeholder-gray-400"
                    aria-label="Add email recipient"
                  />
                  <button
                    onClick={handleAddEmail}
                    className="min-h-[44px] min-w-[44px] rounded-md border border-brand-teal bg-brand-teal/10 px-4 py-2 text-sm font-medium text-brand-teal hover:bg-brand-teal/20 dark:border-brand-teal/50"
                    aria-label="Add email recipient"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                  className="min-h-[44px] min-w-[44px] rounded-lg bg-brand-teal px-6 py-2 text-sm font-medium text-white hover:bg-brand-teal/90 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900"
                  aria-label="Save alert configuration"
                >
                  {savingConfig ? 'Saving...' : 'Save Configuration'}
                </button>
                {configSaved && (
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Configuration saved successfully
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
